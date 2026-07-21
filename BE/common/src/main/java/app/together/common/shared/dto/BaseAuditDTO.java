package app.together.common.shared.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;

/**
 * Audit fields mirrored from {@link app.together.common.shared.persistence.BaseAuditEntity}.
 * Entity DTO records include these fields inline; this type documents the shared shape.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record BaseAuditDTO(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy
) implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;
}
