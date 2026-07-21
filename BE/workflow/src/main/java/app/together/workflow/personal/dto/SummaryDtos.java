package app.together.workflow.personal.dto;

import java.time.Instant;

public final class SummaryDtos {

    private SummaryDtos() {
    }

    public record SummarizeDocumentRequest(
            String summaryType,
            String prompt
    ) {
    }

    public record SummaryResponse(
            Long summaryId,
            Long documentId,
            String documentTitle,
            String summaryType,
            String content,
            String modelUsed,
            Instant generatedAt
    ) {
    }

    public record AiSummaryRequest(
            String prompt,
            String documentPath,
            String summaryType
    ) {
    }

    public record AiSummaryResponse(
            String summaryText,
            String modelUsed
    ) {
    }
}
