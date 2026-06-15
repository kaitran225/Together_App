package app.together.workflow.personal.dto;

import java.time.Instant;

public class DocumentAndMindmapDtos {
    private DocumentAndMindmapDtos() {
    }

    public record DocumentResponse(
            Long documentId,
            String title,
            String filePath,
            String fileName,
            Long fileSize,
            String fileType,
            String processingStatus,
            Integer pageCount,
            Integer wordCount,
            Instant lastAccessedAt) {
    }

    public record UploadDocumentRequest(
            String title,
            String filePath,
            String fileName,
            Long fileSize,
            String fileType,
            String mimeType
    ) {
    }

    public record MindmapResponse(
      Long mindmapId,
      Long documentId,
      String title,
      String content,
      String thumbnailUrl
    ){}

    public record SaveMindmapRequest(
      Long documentId,
      String title,
      String content
    ){}
}
