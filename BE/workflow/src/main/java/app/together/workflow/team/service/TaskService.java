package app.together.workflow.team.service;

import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.*;
import app.together.common.workflow.enums.TaskActivityStatus;
import app.together.common.workflow.enums.TaskAttachmentStatus;
import app.together.common.workflow.enums.TaskPriority;
import app.together.common.workflow.enums.TaskStatus;
import app.together.workflow.team.dto.TaskDtos;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.repository.BoardColumnRepository;
import app.together.common.workflow.repository.ProjectRepository;
import app.together.common.workflow.repository.TaskActivityRepository;
import app.together.common.workflow.repository.TaskAssignmentRepository;
import app.together.common.workflow.repository.TaskAttachmentRepository;
import app.together.common.workflow.repository.TaskCommentRepository;
import app.together.common.workflow.repository.TaskDependencyRepository;
import app.together.common.workflow.repository.TaskRepository;
import app.together.common.workflow.repository.TeamMemberRepository;
import app.together.workflow.team.dto.TaskDtos.*;
import lombok.RequiredArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TaskDependencyRepository taskDependencyRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final TaskAttachmentRepository taskAttachmentRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final PermissionCheckService permissionCheckService;

    /*
     * Tạo task mới
     * Quyền: TASK_CREATE (MEMBER, OWNER)
     */
    public TaskDetailsResponse createTask(Long projectId, String userSso, CreateTaskRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(
                        () -> new ResourceNotFoundException(MessageConstants.MESSAGE_PROJECT_NOT_FOUND, projectId));
        TeamMember teamMember = getActiveTeamMember(project.getTeamId(), userSso);

        permissionCheckService.requireTeamRole(Permission.TASK_CREATE, teamMember.getRole());

        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_TITLE_REQUIRED);
        }

        // ưu tiên tự động xếp vào cột đầu tiên nếu không có columId
        Long targetColumnId = request.columnId();
        if (targetColumnId == null) {
            targetColumnId = boardColumnRepository.findByProjectId(projectId).stream()
                    .min((c1, c2) -> Integer.compare(c1.getPosition(), c2.getPosition()))
                    .map(BoardColumn::getColumnId)
                    .orElse(null);
        }

        Task task = Task.builder()
                .projectId(projectId)
                .teamId(project.getTeamId())
                .parentTaskId(request.parentTaskId())
                .title(request.title())
                .description(request.description() != null ? request.description() : null)
                .status(TaskStatus.OPEN.name())
                .priority(request.priority() != null ? request.priority() : TaskPriority.MEDIUM.name())
                .estimatedHours(request.estimatedHours())
                .startDate(request.startDate())
                .dueDate(request.dueDate())
                .columnId(targetColumnId)
                .sprintId(request.sprintId())
                .build();
        task.setCreatedBy(userSso);
        task.setUpdatedBy(userSso);

        Task saved = taskRepository.save(task);

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(saved.getTaskId())
                .userSso(userSso)
                .activityType(TaskActivityStatus.CREAATE_TASK.name())
                .newValue(saved.getTitle())
                .build());

        return getTaskDetails(saved.getTaskId(), userSso);
    }

    /*
     * phân công Task cho một thành viên
     * Quyền: TASK_ASSIGN (OWNER)
     */
    public TaskDetailsResponse assignTask(Long taskId, String userSso, AssignTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));
        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_ASSIGN, teamMember.getRole());

        // người được giao việc phải nằm tron danh sách thành viên
        String targetUserSso = request.targetUserSso();
        getActiveTeamMember(task.getTeamId(), targetUserSso);

        TaskAssignmentId assignmentId = new TaskAssignmentId(taskId, targetUserSso);
        if (taskAssignmentRepository.existsById(assignmentId)) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_ALREADY_ASSIGNED, targetUserSso);
        }

        TaskAssignment assignment = TaskAssignment.builder()
                .taskId(taskId)
                .userSso(targetUserSso)
                .assignedBy(userSso)
                .assignedAt(Instant.now())
                .build();
        taskAssignmentRepository.save(assignment);

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(taskId)
                .userSso(userSso)
                .activityType(TaskActivityStatus.ASSTIGN_TASK.name())
                .newValue(targetUserSso)
                .build());

        return getTaskDetails(taskId, userSso);
    }

    /*
    * tạo phụ thuộc công việc
    * Quyền: TASK_UPDATE (MEMBER,OWNER)
    * */
    public TaskDetailsResponse addDependency(Long taskId, String userSso, AddTaskDependencyRequest request){
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));
        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_UPDATE, teamMember.getRole());

        Long dependsOnTaskId = request.dependsOnTaskId();
        if(Objects.equals(taskId, dependsOnTaskId)){
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_CANNOT_DEPEND_ON_ITSELF);
        }

        Task dependsOnTask = taskRepository.findById(dependsOnTaskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_MUST_BE_PROJECT, dependsOnTaskId));

        TaskDependencyId reverseId = new TaskDependencyId(dependsOnTaskId, taskId);
        if (taskDependencyRepository.existsById(reverseId)) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_DEPENDENCY_INVALID);
        }

        TaskDependency dependency = TaskDependency.builder()
                .taskId(taskId)
                .dependsOnTaskId(dependsOnTaskId)
                .dependencyType(request.dependencyType() != null ? request.dependencyType().trim().toUpperCase() : "FS")
                .build();
        taskDependencyRepository.save(dependency);

        return getTaskDetails(taskId, userSso);
    }

    /*
    * thêm thảo luận
    * quyền: WORKFLOW_READ (Thành viên hoạt động là được)
    * */
    public TaskDetailsResponse addComment(Long taskId, String userSso, AddTaskCommentRequest request){
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));
        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        if(request.content() == null || request.content().isBlank()){
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_COMMENT_CONTENT_REQUIRED);
        }

        TaskComment comment = TaskComment.builder()
                .taskId(taskId)
                .userSso(userSso)
                .content(request.content())
                .attachments(request.attachments())
                .build();
        taskCommentRepository.save(comment);

        return getTaskDetails(taskId, userSso);
    }

    /*
    * Đính kèm tệp vào task
    * Quyền: WORKFLOW_READ
    * */
    public TaskDetailsResponse addAttachment(Long taskId, String userSso, AddAttachmentRequest request){
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));
        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        if(request.title() == null || request.title().isBlank()){
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_TITLE_REQUIRED);
        }

        if(request.url() == null || request.url().isBlank()){
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_ATTACHMENT_URL_REQUIRED);
        }

        TaskAttachment att = TaskAttachment.builder()
                .taskId(taskId)
                .attachmentType(request.attachmentType() != null ? request.attachmentType().trim() : TaskAttachmentStatus.FILE.name())
                .title(request.title())
                .url(request.url())
                .uploadedBy(userSso)
                .uploadedAt(Instant.now())
                .build();
        taskAttachmentRepository.save(att);
        return getTaskDetails(taskId, userSso);
    }

    /*
    * lấy thông tin đầy đủ của task
    *  */
    @Transactional(readOnly = true)
    public TaskDetailsResponse getTaskDetails(Long taskId, String userSso) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));

        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        // lấy danh sach sso được phân công
        List<String> assignees = taskAssignmentRepository.findByTaskId(taskId).stream()
                .map(TaskAssignment::getUserSso)
                .toList();

        // lấy danh sách liên kết phụ thuộc
        List<TaskDtos.TaskDependencyResponse> dependencies = taskDependencyRepository.findByTaskId(taskId).stream()
                .map(dep -> new TaskDependencyResponse(
                        dep.getDependsOnTaskId(),
                        dep.getDependencyType()))
                .toList();

        // lấy danh sách comment trên task đó
        List<TaskCommentResponse> comments = taskCommentRepository.findByTaskId(taskId).stream()
                .map(comn -> new TaskCommentResponse(
                        comn.getCommentId(),
                        comn.getUserSso(),
                        comn.getContent(),
                        comn.getAttachments(),
                        comn.getCreatedAt()))
                .toList();

        // lấy tệp đính kèm
        List<TaskAttachmentResponse> attachments = taskAttachmentRepository.findByTaskId(taskId).stream()
                .map(att -> new TaskAttachmentResponse(
                        att.getAttachmentId(),
                        att.getAttachmentType(),
                        att.getTitle(),
                        att.getUrl(),
                        att.getUploadedBy(),
                        att.getUploadedAt()))
                .toList();

        return new TaskDetailsResponse(
                task.getTaskId(),
                task.getProjectId(),
                task.getTeamId(),
                task.getRoomId(),
                task.getParentTaskId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getEstimatedHours(),
                task.getActualHours(),
                task.getStartDate(),
                task.getDueDate(),
                task.getCompletedAt(),
                task.getColumnId(),
                task.getSprintId(),
                assignees,
                dependencies,
                comments,
                attachments);
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
