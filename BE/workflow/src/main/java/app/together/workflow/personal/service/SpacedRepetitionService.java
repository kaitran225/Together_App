package app.together.workflow.personal.service;

import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Flashcard;
import app.together.common.workflow.entity.FlashcardId;
import app.together.common.workflow.repository.FlashcardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional
public class SpacedRepetitionService {

    private final FlashcardRepository  flashcardRepository;

    /**
     * Cập nhật Flashcard dựa trên chất lượng ghi nhớ (Quality) của người dùng dùng thuật toán SM-2.
     * @param quality: Điểm đánh giá độ nhớ của người dùng (từ 0 đến 5):
     *                 5 - Nhớ hoàn hảo, không cần suy nghĩ
     *                 4 - Nhớ chính xác sau khi ngập ngừng chút ít
     *                 3 - Nhớ chính xác nhưng cực kỳ khó khăn
     *                 2 - Nhớ sai; nhưng khi xem đáp án thì thấy rất dễ nhớ ra
     *                 1 - Nhớ sai; khi xem đáp án vẫn thấy xa lạ
     *                 0 - Quên hoàn toàn
     */
    public Flashcard reviewFlashcard(Long quizId, Long quizQuestionId, int quality) {
        if (quality < 0 || quality > 5) {
            throw new BadRequestException("Điểm đánh giá chất lượng ghi nhớ phải nằm trong khoảng từ 0 đến 5.");
        }

        FlashcardId id = new FlashcardId(quizId, quizQuestionId);
        Flashcard flashcard = flashcardRepository.findById(id)
                .orElseGet(() -> Flashcard.builder()
                        .quizId(quizId)
                        .quizQuestionId(quizQuestionId)
                        .easeFactor(BigDecimal.valueOf(2.50)) // Giá trị mặc định của thuật toán SM-2 là 2.50
                        .interval(0)
                        .repetitions(0)
                        .build());

        BigDecimal easeFactor = flashcard.getEaseFactor();
        int interval = flashcard.getInterval();
        int repetitions = flashcard.getRepetitions();

        // Thuật toán toán học SM-2:
        if (quality >= 3) {
            // Trường hợp nhớ đúng (Quality >= 3)
            if (repetitions == 0) {
                interval = 1;
            } else if (repetitions == 1) {
                interval = 6;
            } else {
                // interval = interval * easeFactor
                interval = BigDecimal.valueOf(interval)
                        .multiply(easeFactor)
                        .setScale(0, RoundingMode.HALF_UP)
                        .intValue();
            }
            repetitions++;
        } else {
            // Trường hợp quên/nhớ sai (Quality < 3) -> Reset lại chu kỳ lặp về ban đầu
            repetitions = 0;
            interval = 1;
        }

        // Tính toán lại Ease Factor (độ dễ nhớ của thẻ) mới:
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        double qFactor = 5 - quality;
        double efAdjustment = 0.1 - qFactor * (0.08 + qFactor * 0.02);

        easeFactor = easeFactor.add(BigDecimal.valueOf(efAdjustment)).setScale(2, RoundingMode.HALF_UP);

        // Giới hạn dưới của Ease Factor trong thuật toán SM-2 luôn là 1.30 (không được phép nhỏ hơn)
        if (easeFactor.compareTo(BigDecimal.valueOf(1.30)) < 0) {
            easeFactor = BigDecimal.valueOf(1.30);
        }

        // Cập nhật các thông số mới vào thực thể
        flashcard.setEaseFactor(easeFactor);
        flashcard.setInterval(interval);
        flashcard.setRepetitions(repetitions);
        flashcard.setNextReviewDate(LocalDate.now().plusDays(interval)); // Đặt ngày ôn tập tiếp theo

        return flashcardRepository.save(flashcard);
    }
}
