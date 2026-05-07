package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class QuizAttemptDto {
    Long attemptId;
    Long quizId;
    String userSso;
    BigDecimal score;
    Boolean isCorrect;
    Integer pointsEarned;
    Integer pointsPossible;
    Integer timeSpentSeconds;
    String status;
    Instant startedAt;
    Instant completedAt;

}
