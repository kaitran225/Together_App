package app.together.common.ai.api;

import java.util.List;

public record QuizQuestionDto(
        int id,
        String question,
        List<String> options,
        int correctIndex) {
}
