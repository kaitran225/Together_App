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
public class QuizDto {
    Long quizId;
    Long documentId;
    String userSso;
    String title;
    String description;
    String difficulty;
    Integer timeLimitMinutes;
    Integer passingScore;
    Boolean isRandomized;
    Boolean showAnswers;

}
