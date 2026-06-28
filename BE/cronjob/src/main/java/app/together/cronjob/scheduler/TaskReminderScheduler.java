package app.together.cronjob.scheduler;

import app.together.common.workflow.entity.Notification;
import app.together.common.workflow.entity.Task;
import app.together.common.workflow.entity.TaskAssignment;
import app.together.common.workflow.repository.NotificationRepository;
import app.together.common.workflow.repository.TaskAssignmentRepository;
import app.together.common.workflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled task chạy mỗi giờ để kiểm tra các task sắp đến hạn
 * và tạo notification nhắc nhở cho các thành viên được giao việc.
 *
 * Ngưỡng nhắc nhở: task có dueDate là ngày hôm nay hoặc ngày mai.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TaskReminderScheduler {

    private static final String NOTIFICATION_TYPE_TASK_REMINDER = "TASK_REMINDER";
    private static final String NOTIFICATION_LINK_TYPE_TASK = "TASK";
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final TaskRepository taskRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final NotificationRepository notificationRepository;

    /**
     * Chạy mỗi giờ, quét tất cả task có due date là hôm nay hoặc ngày mai
     * và chưa hoàn thành (status != DONE).
     * Tạo notification nhắc nhở cho mỗi người được giao task đó.
     */
    @Scheduled(cron = "0 0 * * * *") // Mỗi giờ
    @Transactional
    public void remindUpcomingTasks() {
        log.info("TaskReminderScheduler: Bắt đầu quét task sắp đến hạn...");

        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        LocalDate tomorrow = today.plusDays(1);

        List<Task> allTasks = taskRepository.findAll();
        int reminderCount = 0;

        for (Task task : allTasks) {
            // Bỏ qua task đã hoàn thành, đã xóa, hoặc không có deadline
            if (task.getDueDate() == null || task.getDeletedAt() != null
                    || "DONE".equals(task.getStatus()) || "DRAFT".equals(task.getStatus())) {
                continue;
            }

            LocalDate dueDate = task.getDueDate();

            // Chỉ nhắc task có deadline là hôm nay hoặc ngày mai
            if (dueDate.equals(today) || dueDate.equals(tomorrow)) {
                List<TaskAssignment> assignments = taskAssignmentRepository.findByTaskId(task.getTaskId());

                for (TaskAssignment assignment : assignments) {
                    boolean alreadyNotified = notificationRepository.existsByUserSsoAndTypeAndLinkId(
                            assignment.getUserSso(), NOTIFICATION_TYPE_TASK_REMINDER, task.getTaskId());

                    if (!alreadyNotified) {
                        createReminderNotification(assignment.getUserSso(), task, dueDate, today);
                        reminderCount++;
                    }
                }
            }
        }

        log.info("TaskReminderScheduler: Hoàn tất. Đã tạo {} thông báo nhắc nhở.", reminderCount);
    }

    private void createReminderNotification(String userSso, Task task, LocalDate dueDate, LocalDate today) {
        long daysLeft = ChronoUnit.DAYS.between(today, dueDate);
        String timeLeft = daysLeft == 0 ? "hôm nay" : "ngày mai";

        Notification notification = Notification.builder()
                .userSso(userSso)
                .type(NOTIFICATION_TYPE_TASK_REMINDER)
                .title("⏰ Sắp đến hạn: " + task.getTitle())
                .message(String.format("Task \"%s\" sẽ đến hạn %s. Hãy hoàn thành sớm nhé!",
                        task.getTitle(), timeLeft))
                .linkType(NOTIFICATION_LINK_TYPE_TASK)
                .linkId(task.getTaskId())
                .isRead(false)
                .expiresAt(Instant.now().plus(2, ChronoUnit.DAYS))
                .build();

        notificationRepository.save(notification);
    }
}
