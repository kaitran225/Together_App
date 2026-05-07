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
public class QuizQuestionDto {
    Long questionId;
    Long quizId;
    String questionType;
    String questionText;
    String options;
    String correctAnswer;
    String explanation;
    Integer points;
    Integer position;

}
