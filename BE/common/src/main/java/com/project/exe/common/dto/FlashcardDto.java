package com.project.exe.common.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class FlashcardDto {
    Long quizId;
    Long quizQuestionId;
    BigDecimal easeFactor;
    Integer interval;
    Integer repetitions;
    LocalDate nextReviewDate;

}
