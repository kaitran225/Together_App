package app.together.workflow.payment.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.enums.UserTier;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Coin gates for features. AI is free for all tiers.
 * Upload costs coins only for FREE and TEAM (legacy TEAMS) while the plan is active
 * (expired paid plans are treated like FREE for billing).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class FeatureUsageService {

    /** Coin cost per file upload for FREE / TEAM. */
    public static final int UPLOAD_COST = 5;

    private final UserRepository userRepository;
    private final WalletService walletService;

    /**
     * Trừ coin khi upload tài liệu — chỉ FREE và TEAM (còn hạn hoặc FREE).
     * Plus / Pro / Combo / Enterprise: miễn phí.
     */
    public void chargeUploadIfRequired(String userSso) {
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", userSso));

        UserTier tier = UserTier.parse(user.getPlanType());
        boolean planStillValid = user.getPlanExpiresAt() == null || user.getPlanExpiresAt().isAfter(Instant.now());

        // Hết hạn → coi như FREE
        if (!planStillValid) {
            tier = UserTier.FREE;
        }

        if (tier != UserTier.FREE && tier != UserTier.TEAM) {
            return;
        }

        walletService.debit(userSso, UPLOAD_COST, "PDF_UPLOAD",
                "Upload tài liệu (gói " + tier.name() + ")");
    }
}
