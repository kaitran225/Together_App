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
public class AppConfigDto {
    String configKey;
    String configType;
    String value;
    String description;
    String displayName;
    Boolean isPublic;
    Boolean isEnabled;
    Integer rolloutPercentage;
    String featureType;
    Integer unlockLevel;
    String iconUrl;

}
