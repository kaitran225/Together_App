package app.together.workflow.payment.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.payment.dto.PaymentDtos.*;
import app.together.workflow.payment.service.PayOsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow/payment")
@RequiredArgsConstructor
public class PayOsController {

    private final PayOsService payOsService;

    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(@RequestParam("packageId") Long packageId) {
        String currentUserSso = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(payOsService.createPaymentLink(currentUserSso, packageId));
    }

    @PostMapping("/payos/webhook")
    public ApiResponse<String> handlePayOsWebhook(@RequestBody PayOsWebhookPayload payload) {
        payOsService.handlePayOsWebHook(payload);
        return ApiResponse.ok("success");
    }
}
