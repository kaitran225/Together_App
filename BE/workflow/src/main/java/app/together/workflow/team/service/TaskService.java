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
    private final app.together.common.auth.repository.UserRepository userRepository;
    private final TaskLifecycleHelper taskLifecycleHelper;

    @org.springframework.beans.factory.annotation.Value("${app.email-service.base-url:http://localhost:8895}")
    private String emailServiceBaseUrl;

    @org.springframework.beans.factory.annotation.Value("${app.email-service.internal-api-key:dev-internal-email-key}")
    private String internalApiKey;

    @org.springframework.beans.factory.annotation.Value("${app.frontend.public-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

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

        // Mặc định đưa vào cột To Do
        Long targetColumnId = request.columnId();
        if (targetColumnId == null) {
            List<BoardColumn> columns = boardColumnRepository.findByProjectId(projectId);
            targetColumnId = columns.stream()
                    .filter(c -> c.getName() != null && (
                            "To Do".equalsIgnoreCase(c.getName().trim())
                                    || "Todo".equalsIgnoreCase(c.getName().trim())
                                    || "To-Do".equalsIgnoreCase(c.getName().trim())))
                    .map(BoardColumn::getColumnId)
                    .findFirst()
                    .orElseGet(() -> columns.stream()
                            .min((c1, c2) -> Integer.compare(
                                    c1.getPosition() != null ? c1.getPosition() : 0,
                                    c2.getPosition() != null ? c2.getPosition() : 0))
                            .map(BoardColumn::getColumnId)
                            .orElse(null));
        }

        Task task = Task.builder()
                .projectId(projectId)
                .teamId(project.getTeamId())
                .parentTaskId(request.parentTaskId())
                .title(request.title())
                .description(request.description() != null ? request.description() : null)
                .status(TaskStatus.OPEN.name()) // To Do
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

        // delete existing assignments
        List<TaskAssignment> currentAssignments = taskAssignmentRepository.findByTaskId(taskId);
        taskAssignmentRepository.deleteAll(currentAssignments);

        String targetUserSso = request.targetUserSso();
        if (targetUserSso == null || targetUserSso.isBlank()) {
            return getTaskDetails(taskId, userSso);
        }

        // người được giao việc phải nằm tron danh sách thành viên
        getActiveTeamMember(task.getTeamId(), targetUserSso);

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

        // Send email notification to assignee
        try {
            userRepository.findByUserSso(targetUserSso).ifPresent(user -> {
                if (user.getEmail() != null && !user.getEmail().isBlank()) {
                    sendAssignmentEmail(user.getEmail(), task.getTitle());
                }
            });
        } catch (Exception e) {
            // Log but don't fail transaction
            System.err.println("Failed to send task assignment email: " + e.getMessage());
        }

        return getTaskDetails(taskId, userSso);
    }

    private void sendAssignmentEmail(String toEmail, String taskTitle) {
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
            String json = String.format(
                "{\"type\":\"TASK_ASSIGNED\",\"toEmail\":\"%s\",\"rawToken\":\"%s\",\"linkBaseUrl\":\"%s\"}",
                toEmail,
                taskTitle.replace("\"", "\\\""),
                frontendBaseUrl
            );
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                .uri(java.net.URI.create(emailServiceBaseUrl + "/api/v1/internal/emails/transactional"))
                .header("Content-Type", "application/json")
                .header("X-Internal-Api-Key", internalApiKey)
                .POST(java.net.http.HttpRequest.BodyPublishers.ofString(json))
                .build();
            client.sendAsync(req, java.net.http.HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            System.err.println("Failed to send task assignment email: " + e.getMessage());
        }
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
    @Transactional
    public TaskDetailsResponse updateTask(Long taskId, String userSso, UpdateTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));
        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_UPDATE, teamMember.getRole());

        if (request.title() != null && !request.title().isBlank()) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.startDate() != null) {
            task.setStartDate(request.startDate());
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }
        if (request.completedAt() != null) {
            task.setCompletedAt(request.completedAt());
        }
        if (request.status() != null && !request.status().isBlank()) {
            String oldStatus = task.getStatus();
            String newStatus = normalizeTaskStatus(request.status());
            task.setStatus(newStatus);
            if (taskLifecycleHelper.isTransitioningToInProgress(oldStatus, newStatus)) {
                taskLifecycleHelper.markInProgressStarted(task);
            }
            if (taskLifecycleHelper.isTransitioningToDone(oldStatus, newStatus)) {
                if (task.getCompletedAt() == null) {
                    task.setCompletedAt(Instant.now());
                }
                taskLifecycleHelper.applyActualHoursOnComplete(task);
            }
        }

        taskRepository.save(task);

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(taskId)
                .userSso(userSso)
                .activityType(TaskActivityStatus.UPDATE_TASK.name())
                .newValue("Updated task fields")
                .build());

        return getTaskDetails(taskId, userSso);
    }

    /**
     * Soft-delete task. Quyền: TASK_DELETE (OWNER)
     */
    public void deleteTask(Long taskId, String userSso) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));
        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_DELETE, teamMember.getRole());

        Instant now = Instant.now();
        task.setDeletedAt(now);
        task.setUpdatedBy(userSso);
        taskRepository.save(task);

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(taskId)
                .userSso(userSso)
                .activityType(TaskActivityStatus.UPDATE_TASK.name())
                .oldValue(task.getStatus())
                .newValue("DELETED")
                .build());
    }

    /**
     * Map tên cột / status tự do từ FE về enum TaskStatus.
     */
    private String normalizeTaskStatus(String status) {
        if (status == null || status.isBlank()) {
            return TaskStatus.OPEN.name();
        }
        String normalized = status.trim().toUpperCase(java.util.Locale.ROOT)
                .replace('-', '_')
                .replace(' ', '_');
        return switch (normalized) {
            case "TO_DO", "TODO", "BACKLOG", "OPEN", "DRAFT" -> TaskStatus.OPEN.name();
            case "IN_PROGRESS", "INPROGRESS", "DOING", "PROGRESS" -> TaskStatus.IN_PROGRESS.name();
            case "IN_REVIEW", "INREVIEW", "REVIEW" -> TaskStatus.IN_REVIEW.name();
            case "DONE", "COMPLETED", "COMPLETE" -> TaskStatus.DONE.name();
            case "CANCELLED", "CANCELED" -> TaskStatus.CANCELLED.name();
            default -> {
                // If already a valid enum name, keep it; otherwise default OPEN
                try {
                    yield TaskStatus.valueOf(normalized).name();
                } catch (IllegalArgumentException ex) {
                    yield TaskStatus.OPEN.name();
                }
            }
        };
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
