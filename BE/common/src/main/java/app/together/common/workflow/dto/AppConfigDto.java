package app.together.common.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/** Entity DTO with audit fields (flat JSON, same as former {@code BaseAuditDTO} subclasses). */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record AppConfigDto(
        Instant createdAt,
        String createdBy,
        Instant updatedAt,
        String updatedBy,
        String configKey,
        String configType,
        String value,
        String description,
        String displayName,
        Boolean isPublic,
        Boolean isEnabled,
        Integer rolloutPercentage,
        String featureType,
        Integer unlockLevel,
        String iconUrl
) {
}
