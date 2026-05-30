package app.together.common.ai.api;

import jakarta.validation.constraints.NotBlank;

public record AiAttachmentDto(
        @NotBlank String name,
        String contentType,
        @NotBlank String textExcerpt) {
}
