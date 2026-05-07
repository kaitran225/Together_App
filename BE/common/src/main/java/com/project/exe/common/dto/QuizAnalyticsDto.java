package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuizAnalyticsDto {
    Long analyticsId;
    Long userMasterDataId;
    String weakTopics;
    String strongTopics;
    String mistakePatterns;
    String recommendations;
    Instant generatedAt;

}
