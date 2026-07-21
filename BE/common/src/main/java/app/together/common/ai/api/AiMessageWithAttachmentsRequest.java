package app.together.common.ai.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** getMessage(String msg, List&lt;Attachment&gt; att) */
public record AiMessageWithAttachmentsRequest(
        @NotBlank String message,
        @NotEmpty @Valid List<AiAttachmentDto> attachments,
        AiContextDto context,
        String llm) {
}
