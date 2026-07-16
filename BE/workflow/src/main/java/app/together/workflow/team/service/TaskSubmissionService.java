package app.together.workflow.team.service;

import app.together.common.auth.enums.TeamRole;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.*;
import app.together.common.workflow.enums.TaskActivityStatus;
import app.together.common.workflow.enums.TaskStatus;
import app.together.common.workflow.enums.TaskSubmissionStatus;
import app.together.common.workflow.repository.*;
import app.together.workflow.team.dto.TaskSubmissionDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskSubmissionService {

    private final TaskSubmissionRepository taskSubmissionRepository;
    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TaskActivityRepository taskActivityRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final PermissionCheckService permissionCheckService;

    /*
     * Thành viên nộp bài làm/sản phẩm bàn giao cho Task (IN_PROGRESS → IN_REVIEW)
     * Quyền: TASK_UPDATE
     */
    public TaskSubmissionResponse submitTask(Long taskId, String userSso, SubmitTaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));

        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_UPDATE, teamMember.getRole());

        TaskAssignmentId assignmentId = new TaskAssignmentId(taskId, userSso);
        if (!taskAssignmentRepository.existsById(assignmentId)) {
            throw new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_ASSIGNMENT_NOT_FOUND, assignmentId);
        }

        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_SUBMISSION_CONTENT_REQUIRED);
        }

        String currentStatus = task.getStatus() != null ? task.getStatus() : TaskStatus.OPEN.name();
        if (!TaskStatus.IN_PROGRESS.name().equalsIgnoreCase(currentStatus)
                && !TaskStatus.OPEN.name().equalsIgnoreCase(currentStatus)) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_ACTIVITY_INVALID);
        }

        TaskSubmission submission = TaskSubmission.builder()
                .taskId(taskId)
                .userSso(userSso)
                .content(request.content().trim())
                .attachments(request.attachments())
                .status(TaskSubmissionStatus.PENDING.name())
                .submittedAt(Instant.now())
                .build();
        submission.setCreatedBy(userSso);
        submission.setUpdatedBy(userSso);

        TaskSubmission saved = taskSubmissionRepository.save(submission);

        String oldStatus = task.getStatus();
        task.setStatus(TaskStatus.IN_REVIEW.name());
        task.setCompletedAt(null);
        moveTaskToColumnNamed(task, "In Review");
        taskRepository.save(task);

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(taskId)
                .userSso(userSso)
                .activityType(TaskActivityStatus.SUBMIT.name())
                .oldValue(oldStatus)
                .newValue(TaskStatus.IN_REVIEW.name())
                .metadata(String.format("{\"submissionId\":%s}", saved.getSubmissionId()))
                .build());

        return toSubmissionResponse(saved);
    }

    /*
     * Kiểm tra và chấm điểm bài nộp
     * Quyền: TASK_EVALUATE (OWNER)
     */
    public TaskSubmissionResponse evaluateSubmission(Long submissionId, String userSso, EvaluateTaskRequest request) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, submissionId));

        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, submission.getTaskId()));

        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_EVALUATE, teamMember.getRole());

        if (request.grade() != null) {
            BigDecimal grade = request.grade();
            if (grade.compareTo(BigDecimal.ZERO) < 0 || grade.compareTo(BigDecimal.valueOf(10)) > 0) {
                throw new BadRequestException(MessageConstants.MESSAGE_TASK_SUBMISSION_GRADE_INVALID);
            }
            submission.setGrade(grade);
        }

        String oldSubmissionStatus = submission.getStatus();
        String targetStatus = request.status() != null ? request.status() : TaskSubmissionStatus.APPROVED.name();
        if (!List.of(
                TaskSubmissionStatus.PENDING.name(),
                TaskSubmissionStatus.APPROVED.name(),
                TaskSubmissionStatus.REJECTED.name()).contains(targetStatus)) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_SUBMISSION_GRADE_INVALID);
        }

        submission.setStatus(targetStatus);
        submission.setFeedback(request.feedback() != null ? request.feedback().trim() : null);
        submission.setUpdatedBy(userSso);

        TaskSubmission saved = taskSubmissionRepository.save(submission);

        if (TaskSubmissionStatus.APPROVED.name().equals(targetStatus)) {
            String oldTaskStatus = task.getStatus();
            task.setStatus(TaskStatus.DONE.name());
            task.setCompletedAt(Instant.now());
            moveTaskToColumnNamed(task, "Done");
            taskRepository.save(task);

            taskActivityRepository.save(TaskActivity.builder()
                    .taskId(task.getTaskId())
                    .userSso(userSso)
                    .activityType(TaskActivityStatus.COMPLETE_TASK.name())
                    .oldValue(oldTaskStatus)
                    .newValue(TaskStatus.DONE.name())
                    .build());
        } else if (TaskSubmissionStatus.REJECTED.name().equals(targetStatus)) {
            String oldTaskStatus = task.getStatus();
            task.setStatus(TaskStatus.IN_PROGRESS.name());
            task.setCompletedAt(null);
            moveTaskToColumnNamed(task, "In Progress");
            taskRepository.save(task);

            taskActivityRepository.save(TaskActivity.builder()
                    .taskId(task.getTaskId())
                    .userSso(userSso)
                    .activityType(TaskActivityStatus.MOVE_TASK.name())
                    .oldValue(oldTaskStatus)
                    .newValue(TaskStatus.IN_PROGRESS.name())
                    .metadata("{\"reason\":\"submission_rejected\"}")
                    .build());
        }

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(task.getTaskId())
                .userSso(userSso)
                .activityType(TaskActivityStatus.EVALUATE_SUBMISSION.name())
                .oldValue(oldSubmissionStatus)
                .newValue(targetStatus)
                .metadata(String.format("{\"grade\": %s}", submission.getGrade()))
                .build());

        return toSubmissionResponse(saved);
    }

    /*
     * Lấy danh sách các lần nộp bài của một task
     * Quyền: WORKFLOW_READ
     */
    public List<TaskSubmissionResponse> getSubmissionsForTask(Long taskId, String userSso) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));

        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        List<TaskSubmission> submissions = taskSubmissionRepository.findByTaskId(taskId);

        if (TeamRole.MEMBER.equals(teamMember.getRole())) {
            return submissions.stream()
                    .filter(sub -> Objects.equals(sub.getUserSso(), userSso))
                    .map(this::toSubmissionResponse)
                    .toList();
        }

        return submissions.stream()
                .map(this::toSubmissionResponse)
                .toList();
    }

    private void moveTaskToColumnNamed(Task task, String columnName) {
        if (task.getProjectId() == null || columnName == null || columnName.isBlank()) {
            return;
        }
        boardColumnRepository.findByProjectId(task.getProjectId()).stream()
                .filter(c -> columnName.equalsIgnoreCase(c.getName()))
                .findFirst()
                .ifPresent(c -> task.setColumnId(c.getColumnId()));
    }

    private TeamMember getActiveTeamMember(Long teamId, String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new ResourceNotFoundException(MessageConstants.MESSAGE_USER_NOT_FOUND, userSso);
        }

        return teamMemberRepository.findById(new TeamMemberId(teamId, userSso))
                .filter(m -> m.getLeftAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_MEMBER_NOT_FOUND, userSso));
    }

    private TaskSubmissionResponse toSubmissionResponse(TaskSubmission sub) {
        return new TaskSubmissionResponse(
                sub.getSubmissionId(),
                sub.getTaskId(),
                sub.getUserSso(),
                sub.getContent(),
                sub.getAttachments(),
                sub.getGrade(),
                sub.getFeedback(),
                sub.getStatus(),
                sub.getSubmittedAt()
        );
    }
}
