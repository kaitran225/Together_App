package app.together.workflow.payment.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.enums.UserTier;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.UserFeatureUsage;
import app.together.common.workflow.entity.UserFeatureUsageId;
import app.together.common.workflow.repository.UserFeatureUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Cổng thu Coin cho các tính năng dành cho gói FREE. Người dùng gói trả phí còn hạn
 * dùng miễn phí; người dùng FREE (hoặc gói trả phí đã hết hạn) bị trừ Coin mỗi lần
 * dùng — hoặc theo khung giờ (VD: AI chat trả phí 1 lần, dùng thoải mái trong 1 tiếng).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FeatureUsageService {

    public static final int FEATURE_COST = 25;

    private final UserRepository userRepository;
    private final UserFeatureUsageRepository userFeatureUsageRepository;
    private final WalletService walletService;

    /**
     * @param windowMinutes 0 = trừ Coin mỗi lần gọi; &gt;0 = chỉ trừ Coin nếu lần trừ gần nhất
     *                      cho featureCode này đã quá {@code windowMinutes} phút.
     */
    public void chargeIfFree(String userSso, String featureCode, int windowMinutes) {
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", userSso));

        UserTier tier = UserTier.parse(user.getPlanType());
        boolean planStillValid = user.getPlanExpiresAt() == null || user.getPlanExpiresAt().isAfter(Instant.now());
        if (tier != UserTier.FREE && planStillValid) {
            return; // Gói trả phí bao gồm tính năng này, không thu Coin.
        }

        if (windowMinutes <= 0) {
            walletService.debit(userSso, FEATURE_COST, featureCode, "Sử dụng tính năng " + featureCode + " (gói Free)");
            return;
        }

        UserFeatureUsageId id = new UserFeatureUsageId(userSso, featureCode);
        UserFeatureUsage usage = userFeatureUsageRepository.findById(id).orElse(null);
        Instant now = Instant.now();
        boolean windowExpired = usage == null || usage.getLastChargedAt() == null
                || usage.getLastChargedAt().isBefore(now.minus(windowMinutes, ChronoUnit.MINUTES));

        if (!windowExpired) {
            return; // Đã trả phí cho khung giờ hiện tại.
        }

        walletService.debit(userSso, FEATURE_COST, featureCode,
                String.format("Sử dụng tính năng %s trong %d phút (gói Free)", featureCode, windowMinutes));

        UserFeatureUsage toSave = usage != null ? usage : UserFeatureUsage.builder()
                .userSso(userSso)
                .featureCode(featureCode)
                .build();
        toSave.setLastChargedAt(now);
        userFeatureUsageRepository.save(toSave);
    }
}
