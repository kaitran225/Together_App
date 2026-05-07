package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class AchievementDto {
    Long achievementId;
    String name;
    String displayName;
    String description;
    String iconUrl;
    Integer expReward;
    Integer coinReward;
    String requirementType;
    Integer requirementValue;
    Boolean isActive;
}
