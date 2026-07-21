package app.together.workflow.payment.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.SubscriptionPlan;
import app.together.common.workflow.repository.SubscriptionPlanRepository;
import app.together.workflow.payment.dto.SubscriptionDtos.*;
import app.together.workflow.personal.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private static final String FIRST_SUBSCRIBER_ACHIEVEMENT = "FIRST_SUBSCRIBER";

    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final AchievementService achievementService;

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> listActivePlans() {
        return subscriptionPlanRepository.findAllByOrderByDisplayOrderAsc().stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsActive()))
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionPlan requireActivePlan(Long planId) {
        if (planId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NOT_FOUND);
        }
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NOT_FOUND));
        if (!Boolean.TRUE.equals(plan.getIsActive())) {
            throw new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NOT_FOUND);
        }
        if (plan.getPriceVnd() == null || plan.getPriceVnd() <= 0) {
            throw new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NOT_FOUND);
        }
        return plan;
    }

    /**
     * Apply paid subscription after successful PayOS payment (or admin grant).
     */
    public SubscriptionResponse applyPaidPlan(String userSso, SubscriptionPlan plan) {
        requireUserSso(userSso);
        String targetTier = plan.getTierCode().trim().toUpperCase();
        int durationDays = plan.getDurationDays() != null && plan.getDurationDays() > 0
                ? plan.getDurationDays()
                : 30;

        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_USER_NOT_FOUND));

        Instant currentExpiry = user.getPlanExpiresAt();
        Instant newExpiry;
        if (currentExpiry != null && currentExpiry.isAfter(Instant.now()) && targetTier.equals(user.getPlanType())) {
            newExpiry = currentExpiry.plus(durationDays, ChronoUnit.DAYS);
        } else {
            newExpiry = Instant.now().plus(durationDays, ChronoUnit.DAYS);
        }

        user.setPlanType(targetTier);
        user.setPlanExpiresAt(newExpiry);
        userRepository.save(user);

        achievementService.grantIfNotUnlocked(userSso, FIRST_SUBSCRIBER_ACHIEVEMENT);

        return new SubscriptionResponse(userSso, targetTier, newExpiry, plan.getPriceVnd(), "ACTIVE");
    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }
}
