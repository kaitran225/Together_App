package app.together.workflow.team.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.auth.enums.TeamRole;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.Project;
import app.together.common.workflow.entity.Task;
import app.together.common.workflow.entity.TaskAssignment;
import app.together.common.workflow.entity.TeamMember;
import app.together.common.workflow.entity.TeamMemberId;
import app.together.common.workflow.enums.ProjectStatus;
import app.together.common.workflow.enums.TaskStatus;
import app.together.common.workflow.repository.ProjectRepository;
import app.together.common.workflow.repository.TaskAssignmentRepository;
import app.together.common.workflow.repository.TeamMemberRepository;
import app.together.common.workflow.repository.TeamRepository;
import app.together.common.workflow.repository.TaskRepository;
import app.together.workflow.team.dto.ProjectDtos.CreateProjectRequest;
import app.together.workflow.team.dto.ProjectDtos.ProjectResponse;
import app.together.workflow.team.dto.ProjectDtos.UpdateProjectRequest;
import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectsService {

    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final UserRepository userRepository;
    private final ScrumBoardService scrumBoardService;
    private final PermissionCheckService permissionCheckService;

    /*
     * tạo dự án
     * - kiểm tra team có tồn tại
     * - kiểm tra user có quyền truy cập
     * - kiểm tra tên dự án có tồn tại
     * - tạo dự án
     * - khởi tạo scrum board
     * - trả về dự án
     * Todo: sau này thêm điều kiện cho user Free và có mua gói PRO để tạo
     * dự án
     * - sau này thêm điều kiện cho user Free và có mua gói PRO để tạo dự
     * án
     * - Free mua coin để tạo dự án (có giới hạn tạo dự án)
     */
    public ProjectResponse createProject(Long teamId, String userSso, CreateProjectRequest request) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND, teamId));

        TeamMember teamMember = getActiveTeamMember(teamId, userSso);
        // kiểm tra quyền truy cập
        permissionCheckService.requireTeamRole(Permission.TEAM_EDIT, teamMember.getRole());

        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_PROJECT_NAME_REQUIRED);
        }

        Project project = Project.builder()
                .teamId(teamId)
                .name(request.name().trim())
                .description(request.description().trim())
                .status(ProjectStatus.PLANNING.name() != null ? ProjectStatus.PLANNING.name() : null)
                .startDate(request.startDate())
                .dueDate(request.dueDate())
                .build();
        project.setCreatedBy(userSso);
        project.setUpdatedBy(userSso);

        Project savedProject = projectRepository.save(project);

        scrumBoardService.initializeScrumBoard(savedProject.getProjectId());

        return toProjectResponse(savedProject);
    }

    /*
     * lấy danh sách dự án của 1 team
     * Yêu cầu quyền: TEAM_EDIT (Chỉ OWNER được chỉnh sửa)
     */

    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsByTeam(Long teamId, String userSso) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND, teamId));

        TeamMember teamMember = getActiveTeamMember(teamId, userSso);

        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        return projectRepository.findByTeamId(teamId).stream()
                .filter(project -> project.getDeletedAt() == null) // bỏ qua dự án đã xóa mềm
                .map(this::toProjectResponse)
                .toList();
    }

    /*
     * lấy dự án theo id
     * Yêu cầu quyền: WORKFLOW_READ (Chấp nhận MEMBER và OWNER)
     */
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, String userSso) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, member.getRole());

        return toProjectResponse(project);
    }

    /*
     * cập nhật dự án
     * Yêu cầu quyền: TEAM_EDIT (Chỉ OWNER được chỉnh sửa)
     */
    public ProjectResponse updateProject(Long projectId, String userSso, UpdateProjectRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getDeletedAt() != null) {
            throw new ResourceNotFoundException("Project", projectId);
        }

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_EDIT, member.getRole());

        if (request.name() != null && !request.name().isBlank()) {
            project.setName(request.name().trim());
        }
        project.setDescription(request.description() != null ? request.description().trim() : project.getDescription());
        project.setStartDate(request.startDate() != null ? request.startDate() : project.getStartDate());
        project.setDueDate(request.dueDate() != null ? request.dueDate() : project.getDueDate());

        // Nghiệp vụ hoàn thành dự án
        if (request.status() != null) {
            project.setStatus(request.status().trim().toUpperCase());
            if (ProjectStatus.COMPLETED.name().equalsIgnoreCase(request.status().trim())) {
                project.setCompletedAt(Instant.now());
            } else {
                project.setCompletedAt(null);
            }
        }
        project.setUpdatedBy(userSso);

        return toProjectResponse(projectRepository.save(project));
    }

    /*
     * xóa dự án
     * Yêu cầu quyền: TEAM_DELETE (Chỉ OWNER mới được xóa dự án của nhóm)
     */
    public void deleteProject(Long projectId, String userSso) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        if (project.getDeletedAt() != null) {
            return; // Đã xóa từ trước
        }

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_DELETE, member.getRole());

        project.setDeletedAt(Instant.now());
        project.setUpdatedBy(userSso);
        projectRepository.save(project);
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

    public ProjectResponse toProjectResponse(Project project) {
        return new ProjectResponse(
                project.getProjectId(),
                project.getTeamId(),
                project.getName(),
                project.getDescription(),
                project.getStatus(),
                project.getStartDate(),
                project.getDueDate(),
                project.getCompletedAt());
    }

    @Transactional(readOnly = true)
    public byte[] exportProjectTasksCsv(Long projectId, String userSso) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));

        TeamMember member = getActiveTeamMember(project.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, member.getRole());

        List<TeamMember> teamMembers = teamMemberRepository.findByTeamId(project.getTeamId()).stream()
                .filter(m -> m.getLeftAt() == null)
                .toList();

        // Created By luôn là Owner của team
        String ownerSso = teamMembers.stream()
                .filter(m -> TeamRole.OWNER.equals(m.getRole()))
                .map(TeamMember::getUserSso)
                .findFirst()
                .orElse(project.getCreatedBy());
        String ownerName = resolveDisplayName(ownerSso);

        List<Task> tasks = taskRepository.findByProjectId(projectId).stream()
                .filter(t -> t.getDeletedAt() == null)
                .toList();

        List<Long> taskIds = tasks.stream().map(Task::getTaskId).toList();
        List<TaskAssignment> assignments = taskIds.isEmpty()
                ? List.of()
                : taskAssignmentRepository.findByTaskIdIn(taskIds);

        Map<Long, String> assigneeByTaskId = assignments.stream()
                .collect(Collectors.toMap(
                        TaskAssignment::getTaskId,
                        TaskAssignment::getUserSso,
                        (a, b) -> a));

        StringBuilder csv = new StringBuilder();
        csv.append('\ufeff');

        // ── Section 1: Task list ──
        csv.append("=== TASK LIST ===\n");
        csv.append("Task ID,Title,Description,Status,Priority,Assignee,Estimated Hours,Actual Hours,Start Date,Due Date,Completed At,Created By\n");

        for (Task task : tasks) {
            String assigneeSso = assigneeByTaskId.get(task.getTaskId());
            String assigneeName = assigneeSso != null ? resolveDisplayName(assigneeSso) : "";
            csv.append(task.getTaskId()).append(",")
                    .append(escapeCsv(task.getTitle())).append(",")
                    .append(escapeCsv(task.getDescription())).append(",")
                    .append(escapeCsv(task.getStatus())).append(",")
                    .append(escapeCsv(task.getPriority())).append(",")
                    .append(escapeCsv(assigneeName)).append(",")
                    .append(task.getEstimatedHours() != null ? task.getEstimatedHours() : 0).append(",")
                    .append(task.getActualHours() != null ? task.getActualHours() : "").append(",")
                    .append(task.getStartDate() != null ? task.getStartDate().toString() : "").append(",")
                    .append(task.getDueDate() != null ? task.getDueDate().toString() : "").append(",")
                    .append(task.getCompletedAt() != null ? task.getCompletedAt().toString() : "").append(",")
                    .append(escapeCsv(ownerName)).append("\n");
        }

        // ── Section 2: Member task statistics ──
        csv.append("\n=== MEMBER TASK STATISTICS ===\n");
        csv.append("Member,Role,Total Assigned,To Do,In Progress,In Review,Done,Other\n");

        Map<Long, Task> taskById = tasks.stream()
                .collect(Collectors.toMap(Task::getTaskId, t -> t, (a, b) -> a));

        // Count assignments per member
        Map<String, Map<String, Integer>> statsByMember = new LinkedHashMap<>();
        for (TeamMember tm : teamMembers) {
            Map<String, Integer> bucket = new HashMap<>();
            bucket.put("total", 0);
            bucket.put("todo", 0);
            bucket.put("inProgress", 0);
            bucket.put("inReview", 0);
            bucket.put("done", 0);
            bucket.put("other", 0);
            statsByMember.put(tm.getUserSso(), bucket);
        }

        for (TaskAssignment assignment : assignments) {
            Task task = taskById.get(assignment.getTaskId());
            if (task == null) {
                continue;
            }
            Map<String, Integer> bucket = statsByMember.computeIfAbsent(assignment.getUserSso(), k -> {
                Map<String, Integer> b = new HashMap<>();
                b.put("total", 0);
                b.put("todo", 0);
                b.put("inProgress", 0);
                b.put("inReview", 0);
                b.put("done", 0);
                b.put("other", 0);
                return b;
            });
            bucket.merge("total", 1, Integer::sum);
            String phase = normalizeStatusBucket(task.getStatus());
            bucket.merge(phase, 1, Integer::sum);
        }

        for (TeamMember tm : teamMembers) {
            Map<String, Integer> bucket = statsByMember.getOrDefault(tm.getUserSso(), Map.of());
            csv.append(escapeCsv(resolveDisplayName(tm.getUserSso()))).append(",")
                    .append(escapeCsv(tm.getRole() != null ? tm.getRole().name() : "")).append(",")
                    .append(bucket.getOrDefault("total", 0)).append(",")
                    .append(bucket.getOrDefault("todo", 0)).append(",")
                    .append(bucket.getOrDefault("inProgress", 0)).append(",")
                    .append(bucket.getOrDefault("inReview", 0)).append(",")
                    .append(bucket.getOrDefault("done", 0)).append(",")
                    .append(bucket.getOrDefault("other", 0)).append("\n");
        }

        // Unassigned tasks summary
        long unassigned = tasks.stream()
                .filter(t -> !assigneeByTaskId.containsKey(t.getTaskId()))
                .count();
        csv.append("\nUnassigned Tasks,").append(unassigned).append("\n");
        csv.append("Total Tasks,").append(tasks.size()).append("\n");
        csv.append("Report Owner,").append(escapeCsv(ownerName)).append("\n");

        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private String resolveDisplayName(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            return "";
        }
        return userRepository.findByUserSso(userSso)
                .map(u -> {
                    if (u.getFullName() != null && !u.getFullName().isBlank()) {
                        return u.getFullName();
                    }
                    if (u.getEmail() != null && !u.getEmail().isBlank()) {
                        return u.getEmail().split("@")[0];
                    }
                    return userSso;
                })
                .orElse(userSso);
    }

    private String normalizeStatusBucket(String status) {
        if (status == null || status.isBlank()) {
            return "todo";
        }
        String n = status.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        if (Objects.equals(n, TaskStatus.OPEN.name()) || n.equals("TO_DO") || n.equals("TODO") || n.equals("BACKLOG") || n.equals("DRAFT")) {
            return "todo";
        }
        if (Objects.equals(n, TaskStatus.IN_PROGRESS.name()) || n.equals("INPROGRESS") || n.equals("DOING")) {
            return "inProgress";
        }
        if (Objects.equals(n, TaskStatus.IN_REVIEW.name()) || n.equals("INREVIEW") || n.equals("REVIEW")) {
            return "inReview";
        }
        if (Objects.equals(n, TaskStatus.DONE.name()) || n.equals("COMPLETED") || n.equals("COMPLETE")) {
            return "done";
        }
        return "other";
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }
        String field = value.replace("\"", "\"\"");
        if (field.contains(",") || field.contains("\n") || field.contains("\"")) {
            return "\"" + field + "\"";
        }
        return field;
    }
}
