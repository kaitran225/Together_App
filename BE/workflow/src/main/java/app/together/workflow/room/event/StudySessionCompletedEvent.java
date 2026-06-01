package app.together.workflow.room.event;

import java.time.Instant;

public record StudySessionCompletedEvent(
                String userSso,
                int durationMinutes,
                Instant completedAt) {
}
