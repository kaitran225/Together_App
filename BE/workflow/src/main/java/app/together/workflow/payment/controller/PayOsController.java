package app.together.workflow.payment.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.payment.dto.PaymentDtos;
import app.together.workflow.payment.dto.PaymentDtos.*;
import app.together.common.workflow.dto.CoinPackageDto;
import app.together.workflow.payment.service.PayOsService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow/payment")
@RequiredArgsConstructor
public class PayOsController {

    private final PayOsService payOsService;

    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(@RequestParam("packageId") Long packageId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(payOsService.createPaymentLink(currentUserSso, packageId));
    }

    @PostMapping("/payos/webhook")
    public ApiResponse<String> handlePayOsWebhook(@RequestBody PayOsWebhookPayload payload) {
        payOsService.handlePayOsWebHook(payload);
        return ApiResponse.ok("success");
    }

    @GetMapping("/coin-packages")
    public ApiResponse<List<CoinPackageDto>> getCoinPackages() {
        return ApiResponse.ok(payOsService.getActiveCoinPackages());
    }

    @GetMapping("/wallet")
    public ApiResponse<app.together.common.auth.dto.UserWalletDto> getWallet() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(payOsService.getUserWallet(currentUserSso));
    }

    @GetMapping("/transactions")
    public ApiResponse<List<PaymentDtos.TransactionResponse>> getTransactions() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(payOsService.getMyTransactions(currentUserSso));
    }
}
