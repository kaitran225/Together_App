package app.together.workflow.payment.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.payment.dto.SubscriptionDtos;
import app.together.workflow.payment.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workflow/payment/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @PostMapping("/upgrade")
    public ApiResponse<SubscriptionDtos.SubscriptionResponse> upgradeTier(@RequestBody SubscriptionDtos.UpgradeTierRequest request){
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(subscriptionService.upgradeUserTier(currentUserSso, request));
    }
}
