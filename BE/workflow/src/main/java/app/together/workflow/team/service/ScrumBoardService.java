package app.together.workflow.team.service;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.BoardColumn;
import app.together.common.workflow.entity.Project;
import app.together.common.workflow.entity.Task;
import app.together.common.workflow.entity.TaskActivity;
import app.together.common.workflow.entity.TeamMember;
import app.together.common.workflow.entity.TeamMemberId;
import app.together.common.workflow.enums.TaskStatus;
import app.together.common.workflow.enums.TaskActivityStatus;
import app.together.common.workflow.repository.BoardColumnRepository;
import app.together.common.workflow.repository.ProjectRepository;
import app.together.common.workflow.repository.TaskActivityRepository;
import app.together.common.workflow.repository.TaskRepository;
import app.together.common.workflow.repository.TeamMemberRepository;
import app.together.workflow.team.dto.ScrumBoardDtos.BoardColumnResponse;
import app.together.workflow.team.dto.ScrumBoardDtos.CreateColumnRequest;
import app.together.workflow.team.dto.ScrumBoardDtos.MoveTaskRequest;
import app.together.workflow.team.dto.ScrumBoardDtos.ScrumBoardResponse;
import app.together.workflow.team.dto.ScrumBoardDtos.TaskSummaryResponse;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class ScrumBoardService {

        private final ProjectRepository projectRepository;
        private final BoardColumnRepository boardColumnRepository;
        private final TaskRepository taskRepository;
        private final TaskActivityRepository taskActivityRepository;
        private final TeamMemberRepository teamMemberRepository;
        private final PermissionCheckService permissionCheckService;

        public void initializeScrumBoard(Long projectId) {
                List<BoardColumn> boardColums = List.of(
                                BoardColumn.builder().projectId(projectId).name("To Do").position(1)
                                                .colorCode("#6B7280").build(),
                                BoardColumn.builder().projectId(projectId).name("In Progress").position(2)
                                                .colorCode("#3B82F6").build(),
                                BoardColumn.builder().projectId(projectId).name("In Review").position(3)
                                                .colorCode("#F59E0B").build(),
                                BoardColumn.builder().projectId(projectId).name("Done").position(4).colorCode("#10B981")
                                                .build());
                boardColumnRepository.saveAll(boardColums);
        }

        // lấy danh sách cổng vụ trên scrum board
        @Transactional(readOnly = true)
        public ScrumBoardResponse getBoardStage(Long projectId, String userSso) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                MessageConstants.MESSAGE_PROJECT_NOT_FOUND, projectId));
                TeamMember teamMember = getActiveTeamMember(project.getTeamId(), userSso);
                // kiểm tra quyền truy cập
                permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

                List<BoardColumn> columns = boardColumnRepository.findByProjectId(projectId);
                List<Task> tasks = taskRepository.findByProjectId(projectId);

                List<BoardColumnResponse> columnResponses = columns.stream()
                                .sorted((c1, c2) -> Integer.compare(
                                                c1.getPosition() != null ? c1.getPosition() : 0,
                                                c2.getPosition() != null ? c2.getPosition() : 0))
                                .map(column -> {
                                        List<TaskSummaryResponse> taskSummaries = tasks.stream()
                                                        .filter(task -> Objects.equals(task.getColumnId(),
                                                                        column.getColumnId()))
                                                        .map(task -> new TaskSummaryResponse(
                                                                        task.getTaskId(),
                                                                        task.getTitle(),
                                                                        task.getDescription(),
                                                                        task.getStatus(),
                                                                        task.getPriority(),
                                                                        task.getEstimatedHours(),
                                                                        task.getActualHours(),
                                                                        task.getDueDate(),
                                                                        task.getSprintId()))
                                                        .toList();
                                        return new BoardColumnResponse(
                                                        column.getColumnId(),
                                                        column.getProjectId(),
                                                        column.getName(),
                                                        column.getPosition(),
                                                        column.getColorCode(),
                                                        taskSummaries);
                                })
                                .toList();
                return new ScrumBoardResponse(projectId, project.getName(), columnResponses);
        }

        // chuyển task qua các cột (kéo thả)
        public ScrumBoardResponse moveTask(Long projectId, Long taskId, String userSso, MoveTaskRequest request) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                MessageConstants.MESSAGE_PROJECT_NOT_FOUND, projectId));
                TeamMember teamMember = getActiveTeamMember(project.getTeamId(), userSso);
                // kiểm tra quyền truy cập của user để thay đổi task
                permissionCheckService.requireTeamRole(Permission.TASK_UPDATE, teamMember.getRole());

                Task task = taskRepository.findById(taskId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));

                if (!Objects.equals(task.getProjectId(), projectId)) {
                        throw new BadRequestException(MessageConstants.MESSAGE_TASK_NOT_FOUND);
                }

                BoardColumn targetColumn = boardColumnRepository.findById(request.targetColumnId())
                                .orElseThrow(() -> new ResourceNotFoundException("BoardColumn",
                                                request.targetColumnId()));

                if (!Objects.equals(targetColumn.getProjectId(), projectId)) {
                        throw new BadRequestException(MessageConstants.MESSAGE_BOARD_COLUMN_PROJECT_ID_INVALID);
                }

                // lấy tên cột cũ lưu vào log
                String oldColumnName = "BackLog";
                if (task.getColumnId() != null) {
                        oldColumnName = boardColumnRepository.findById(task.getColumnId())
                                        .map(BoardColumn::getName)
                                        .orElse(oldColumnName);
                }

                // cập nhật vị trí cột mới
                task.setColumnId(targetColumn.getColumnId());

                // nếu chuyển sang cột "Done", tự động cập nhật status hoàn thành của Task
                if (TaskStatus.DONE.name().equalsIgnoreCase(targetColumn.getName())) {
                        task.setStatus(TaskStatus.DONE.name());
                        task.setCompletedAt(Instant.now());
                } else {
                        task.setStatus(TaskStatus.IN_PROGRESS.name());
                        task.setCompletedAt(null);
                }
                taskRepository.save(task);

                // Ghi nhật ký lịch sử thay đổi kéo thả vào TaskActivity
                taskActivityRepository.save(TaskActivity.builder()
                                .taskId(taskId)
                                .userSso(userSso)
                                .activityType(TaskActivityStatus.MOVE_TASK.name())
                                .oldValue(oldColumnName)
                                .newValue(targetColumn.getName())
                                .metadata(String.format("{\"oldColumnId\":%s,\"newColumnId\":%s}", task.getColumnId(),
                                                targetColumn.getColumnId()))
                                .build());

                return getBoardStage(projectId, userSso);
        }

        // thêm cột tùy biến trong bảng
        public ScrumBoardResponse createCustomColumn(Long projectId, String userSso, CreateColumnRequest request) {
                Project project = projectRepository.findById(projectId)
                                .orElseThrow(
                                                () -> new ResourceNotFoundException(
                                                                MessageConstants.MESSAGE_PROJECT_NOT_FOUND, projectId));
                TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);

                // kiểm tra quyền truy cập của user để thêm cột tùy biến
                permissionCheckService.requireTeamRole(Permission.WORKFLOW_WRITE, member.getRole());

                BoardColumn column = BoardColumn.builder()
                                .projectId(projectId)
                                .name(request.name().trim())
                                .position(request.position())
                                .colorCode(request.colorCode())
                                .build();
                boardColumnRepository.save(column);

                return getBoardStage(projectId, userSso);
        }

        // lấy team member hoạt động
        public TeamMember getActiveTeamMember(Long teamId, String userSso) {
                if (userSso == null || userSso.isBlank()) {
                        throw new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED);
                }
                return teamMemberRepository.findById(new TeamMemberId(teamId, userSso))
                                .filter(m -> m.getLeftAt() == null)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                MessageConstants.MESSAGE_TEAM_MEMBER_NOT_FOUND,
                                                new TeamMemberId(teamId, userSso)));
        }
}
