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
public class UserPreferencesDto {
    Long userId;
    Boolean emailEnabled;
    Boolean pushEnabled;
    Boolean roomUpdates;
    Boolean taskUpdates;
    Boolean meetingReminders;
    Boolean quizReminders;
    Boolean achievements;
    Boolean marketing;
    String language;
    String timezone;
    String theme;

}
