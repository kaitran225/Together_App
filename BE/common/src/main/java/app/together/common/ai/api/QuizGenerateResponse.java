package app.together.common.ai.api;

import java.util.List;

public record QuizGenerateResponse(List<QuizQuestionDto> questions, boolean stub) {
}
