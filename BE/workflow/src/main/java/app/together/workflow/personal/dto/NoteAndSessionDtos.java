package app.together.workflow.personal.dto;

import java.time.Instant;

public class NoteAndSessionDtos {
    private NoteAndSessionDtos() {
    }

    public record QuickNoteResponse(
            Long noteId,
            String content,
            Boolean isPinned,
            String tags,
            Long linkedToId,
            String linkedToType) {
    }

    public record CreateNoteRequest(
            String content,
            Boolean isPinned,
            String tags,
            Long linkedToId,
            String linkedToType
    ) {
    }

    public record StudySessionResponse(
            Long sessionId,
            Long roomId,
            String sessionType,
            Instant startTime,
            Instant endTime,
            Integer expEarned) {
    }

    public record StartSessionRequest(
            Long roomId,
            String sessionType
    ){}
}
