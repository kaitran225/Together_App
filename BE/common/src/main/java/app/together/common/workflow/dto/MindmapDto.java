package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record MindmapDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long mindmapId,
        Long documentId,
        String userSso,
        String title,
        String content,
        String thumbnailUrl
) {
}
