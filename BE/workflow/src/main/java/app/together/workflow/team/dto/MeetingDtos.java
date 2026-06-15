package app.together.workflow.team.dto;

import java.time.Instant;
import java.util.List;

public final class MeetingDtos {

    public MeetingDtos() {
    }

    public record MeetingResponse(
            Long meetingId,
            Long teamId,
            Long roomId,
            Long projectId,
            String title,
            String description,
            String agenda,
            String meetingUrl,
            String status,
            Instant scheduledStart,
            Instant scheduledEnd,
            Instant actualStart,
            Instant actualEnd,
            String recordingUrl,
            String transcriptUrl
    ) {
    }

    public record CreateMeetingRequest(
            Long projectId,
            String title,
            String description,
            String agenda,
            Instant scheduledStart,
            Instant scheduledEnd
    ) {
    }

    public record MeetingNoteRequest(
            String content,
            Boolean isShared
    ) {
    }

    public record MeetingNoteResponse(
            Long noteId,
            Long meetingId,
            String userSso,
            String content,
            Boolean isShared
    ) {
    }

    // map model LLM
    public record AiSummaryPayload(
            String content,
            List<String> keyPoints,
            List<AiProposedTask> actionItems,
            List<String> decisionsMade,
            List<String> nextSteps,
            String modelUsed
    ) {
    }

    public record AiProposedTask(
            String title,
            String description,
            String priority
    ) {
    }

    public record MeetingSummaryResponse(
            Long summaryId,
            Long meetingId,
            String content,
            String keyPoints,
            String actionItems,
            String decisionsMade,
            String nextSteps,
            String modelUsed,
            Instant generatedAt) {
    }
}
