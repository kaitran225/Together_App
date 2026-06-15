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
    private final PermissionCheckService permissionCheckService;

    /*
     * Thành viên nộp bài làm/sản phẩm bàn giao cho Task
     * Quyền: TASK_UPDATE
     * */
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

        // Tạo activity log
        TaskActivity activity = TaskActivity.builder()
                .taskId(taskId)
                .userSso(userSso)
                .activityType(TaskActivityStatus.SUBMIT.name())
                .newValue(String.valueOf(saved.getSubmissionId()))
                .build();

        return toSubmissionResponse(saved);
    }

    /*
     * Kiểm tra và chấm điểm bài nộp
     * Quyền: TASK_EVALUATE (OWNER)
     * */
    public TaskSubmissionResponse evaluateSubmission(Long taskId, String userSso, EvaluateTaskRequest request) {
        TaskSubmission submission = taskSubmissionRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));

        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, submission.getTaskId()));

        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.TASK_EVALUATE, teamMember.getRole());

        if (request.grade() != null) {
            BigDecimal grade = request.grade();
            if (grade.compareTo(BigDecimal.ZERO) <= 0 || grade.compareTo(BigDecimal.valueOf(10)) > 0) {
                throw new BadRequestException(MessageConstants.MESSAGE_TASK_SUBMISSION_GRADE_INVALID);
            }
            submission.setGrade(grade);
        }

        String targetStatus = request.status() != null ? request.status() : TaskSubmissionStatus.PENDING.name();
        if (!List.of(TaskSubmissionStatus.PENDING.toString(), TaskSubmissionStatus.APPROVED.toString(), TaskSubmissionStatus.REJECTED.toString())
                .contains(targetStatus)) {
            throw new BadRequestException(MessageConstants.MESSAGE_TASK_SUBMISSION_GRADE_INVALID);
        }

        submission.setStatus(targetStatus);
        submission.setFeedback(request.feedback() != null ? request.feedback().trim() : null);
        submission.setUpdatedBy(userSso);

        TaskSubmission saved = taskSubmissionRepository.save(submission);

        if (TaskSubmissionStatus.APPROVED.equals(targetStatus)) {
            task.setStatus(TaskStatus.DONE.name());
            task.setCompletedAt(Instant.now());
            taskRepository.save(task);


            taskActivityRepository.save(TaskActivity.builder()
                    .taskId(task.getTaskId())
                    .userSso(userSso)
                    .activityType(TaskActivityStatus.COMPLETE_TASK.name())
                    .oldValue(submission.getStatus())
                    .newValue(TaskActivityStatus.COMPLETE_TASK.name())
                    .build());
        }

        taskActivityRepository.save(TaskActivity.builder()
                .taskId(task.getTaskId())
                .userSso(userSso)
                .activityType(TaskActivityStatus.EVALUATE_SUBMISSION.name())
                .oldValue(submission.getStatus())
                .newValue(targetStatus)
                .metadata(String.format("{\"grade\": %s}", submission.getGrade()))
                .build());

        return toSubmissionResponse(saved);
    }

    /*
    * Lấy danh sách các lần nộp bài của một task
    * Quyền: WORKFLOW_READ (OWNER)
    * */
    public List<TaskSubmissionResponse> getSubmissionsForTask(Long taskId, String userSso) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TASK_NOT_FOUND, taskId));

        TeamMember teamMember = getActiveTeamMember(task.getTeamId(), userSso);
        permissionCheckService.requireTeamRole(Permission.WORKFLOW_READ, teamMember.getRole());

        List<TaskSubmission> submissions = taskSubmissionRepository.findByTaskId(taskId);

        // là member thì xem bài nộp của mình
        if(TeamRole.MEMBER.equals(teamMember.getRole())){
            return submissions.stream()
                    .filter(sub -> Objects.equals(sub.getUserSso(), userSso))
                    .map(this::toSubmissionResponse)
                    .toList();
        }

        return submissions.stream()
                .map(this::toSubmissionResponse)
                .toList();
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
