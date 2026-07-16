package app.together.workflow.payment.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.SubscriptionPlan;
import app.together.workflow.payment.dto.PaymentDtos.CheckoutResponse;
import app.together.workflow.payment.dto.SubscriptionDtos.CheckoutSubscriptionRequest;
import app.together.workflow.payment.service.PayOsService;
import app.together.workflow.payment.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/payment/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PayOsService payOsService;

    @GetMapping("/plans")
    public ApiResponse<List<SubscriptionPlan>> listPlans() {
        return ApiResponse.ok(subscriptionService.listActivePlans());
    }

    /** Pay with VND via PayOS — redirects user to checkout URL. */
    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(@RequestBody CheckoutSubscriptionRequest request) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(payOsService.createSubscriptionPaymentLink(currentUserSso, request.planId()));
    }
}
