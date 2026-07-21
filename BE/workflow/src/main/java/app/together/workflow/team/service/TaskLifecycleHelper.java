package app.together.workflow.team.service;

import app.together.common.workflow.entity.Task;
import app.together.common.workflow.entity.TaskActivity;
import app.together.common.workflow.enums.TaskStatus;
import app.together.common.workflow.repository.TaskActivityRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tracks when a task entered In Progress and computes actualHours when Done.
 */
@Component
public class TaskLifecycleHelper {

    private static final Pattern IN_PROGRESS_STARTED_AT =
            Pattern.compile("\"inProgressStartedAt\"\\s*:\\s*\"([^\"]+)\"");

    private final TaskActivityRepository taskActivityRepository;

    public TaskLifecycleHelper(TaskActivityRepository taskActivityRepository) {
        this.taskActivityRepository = taskActivityRepository;
    }

    public void markInProgressStarted(Task task) {
        if (task == null) {
            return;
        }
        if (readInProgressStartedAt(task.getMetadata()) != null) {
            return;
        }
        Instant startedAt = Instant.now();
        task.setMetadata(upsertInProgressStartedAt(task.getMetadata(), startedAt));
    }

    public void applyActualHoursOnComplete(Task task) {
        if (task == null) {
            return;
        }
        Instant completedAt = task.getCompletedAt() != null ? task.getCompletedAt() : Instant.now();
        task.setCompletedAt(completedAt);

        Instant startedAt = readInProgressStartedAt(task.getMetadata());
        if (startedAt == null) {
            startedAt = findInProgressStartedFromActivities(task.getTaskId());
        }
        if (startedAt == null) {
            startedAt = task.getUpdatedAt() != null ? task.getUpdatedAt() : task.getCreatedAt();
        }
        if (startedAt == null || !startedAt.isBefore(completedAt)) {
            task.setActualHours(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            return;
        }

        double hours = Duration.between(startedAt, completedAt).toMillis() / 3_600_000.0;
        task.setActualHours(BigDecimal.valueOf(hours).setScale(2, RoundingMode.HALF_UP));
    }

    public boolean isTransitioningToInProgress(String oldStatus, String newStatus) {
        String next = normalize(newStatus);
        String prev = normalize(oldStatus);
        return TaskStatus.IN_PROGRESS.name().equals(next) && !TaskStatus.IN_PROGRESS.name().equals(prev);
    }

    public boolean isTransitioningToDone(String oldStatus, String newStatus) {
        String next = normalize(newStatus);
        String prev = normalize(oldStatus);
        return TaskStatus.DONE.name().equals(next) && !TaskStatus.DONE.name().equals(prev);
    }

    private Instant findInProgressStartedFromActivities(Long taskId) {
        if (taskId == null) {
            return null;
        }
        List<TaskActivity> activities = taskActivityRepository.findByTaskId(taskId);
        return activities.stream()
                .filter(a -> {
                    String v = a.getNewValue() != null ? a.getNewValue() : "";
                    String n = normalize(v);
                    return TaskStatus.IN_PROGRESS.name().equals(n)
                            || "IN_PROGRESS".equalsIgnoreCase(v.trim())
                            || "In Progress".equalsIgnoreCase(v.trim());
                })
                .min(Comparator.comparing(TaskActivity::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(TaskActivity::getCreatedAt)
                .orElse(null);
    }

    private Instant readInProgressStartedAt(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return null;
        }
        Matcher matcher = IN_PROGRESS_STARTED_AT.matcher(metadata);
        if (!matcher.find()) {
            return null;
        }
        try {
            return Instant.parse(matcher.group(1));
        } catch (Exception ex) {
            return null;
        }
    }

    private String upsertInProgressStartedAt(String metadata, Instant startedAt) {
        String iso = startedAt.toString();
        if (metadata == null || metadata.isBlank() || "{}".equals(metadata.trim())) {
            return "{\"inProgressStartedAt\":\"" + iso + "\"}";
        }
        if (IN_PROGRESS_STARTED_AT.matcher(metadata).find()) {
            return IN_PROGRESS_STARTED_AT.matcher(metadata)
                    .replaceFirst("\"inProgressStartedAt\":\"" + iso + "\"");
        }
        String trimmed = metadata.trim();
        if (trimmed.endsWith("}")) {
            String body = trimmed.substring(0, trimmed.length() - 1).trim();
            if (body.equals("{") || body.isEmpty()) {
                return "{\"inProgressStartedAt\":\"" + iso + "\"}";
            }
            if (body.endsWith(",")) {
                return body + "\"inProgressStartedAt\":\"" + iso + "\"}";
            }
            return body + ",\"inProgressStartedAt\":\"" + iso + "\"}";
        }
        return "{\"inProgressStartedAt\":\"" + iso + "\"}";
    }

    private String normalize(String status) {
        if (status == null || status.isBlank()) {
            return "";
        }
        String normalized = status.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        return switch (normalized) {
            case "TO_DO", "TODO", "BACKLOG", "OPEN", "DRAFT" -> TaskStatus.OPEN.name();
            case "IN_PROGRESS", "INPROGRESS", "DOING", "PROGRESS" -> TaskStatus.IN_PROGRESS.name();
            case "IN_REVIEW", "INREVIEW", "REVIEW" -> TaskStatus.IN_REVIEW.name();
            case "DONE", "COMPLETED", "COMPLETE" -> TaskStatus.DONE.name();
            case "CANCELLED", "CANCELED" -> TaskStatus.CANCELLED.name();
            default -> normalized;
        };
    }
}
