package app.together.common.workflow.dto;

import app.together.common.shared.constant.MessageConstants;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record DocumentDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        Long documentId,
        @NotBlank(message = MessageConstants.MESSAGE_USER_SSO_REQUIRED)
        @Size(max = 255)
        String userSso,
        Long categoryId,
        @NotBlank(message = MessageConstants.MESSAGE_DOCUMENT_TITLE_REQUIRED)
        @Size(max = 500)
        String title,
        @NotBlank(message = MessageConstants.MESSAGE_DOCUMENT_FILE_PATH_REQUIRED)
        @Size(max = 2048)
        String filePath,
        @NotBlank(message = MessageConstants.MESSAGE_DOCUMENT_FILE_NAME_REQUIRED)
        @Size(max = 255)
        String fileName,
        Long fileSize,
        String fileType,
        @NotBlank(message = MessageConstants.MESSAGE_DOCUMENT_MIME_TYPE_REQUIRED)
        @Size(max = 255)
        String mimeType,
        @NotBlank(message = MessageConstants.MESSAGE_DOCUMENT_PROCESSING_STATUS_REQUIRED)
        @Size(max = 255)
        String processingStatus,
        @NotNull(message = MessageConstants.MESSAGE_DOCUMENT_PAGE_COUNT_REQUIRED)
        Integer pageCount,
        @NotNull(message = MessageConstants.MESSAGE_DOCUMENT_WORD_COUNT_REQUIRED)
        Integer wordCount,
        @NotBlank(message = MessageConstants.MESSAGE_DOCUMENT_LANGUAGE_REQUIRED)
        @Size(max = 255)
        String language
) {
}
