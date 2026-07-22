package app.together.workflow.payment.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.payment.dto.PaymentDtos;
import app.together.workflow.payment.dto.PaymentDtos.*;
import app.together.common.workflow.dto.CoinPackageDto;
import app.together.workflow.payment.service.PayOsService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/workflow/payment")
@RequiredArgsConstructor
@Slf4j
public class PayOsController {

    private final PayOsService payOsService;

    @PostMapping("/checkout")
    public ApiResponse<CheckoutResponse> checkout(@RequestParam("packageId") Long packageId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(payOsService.createPaymentLink(currentUserSso, packageId));
    }

    /**
     * PayOS dashboard probes with GET, and confirm-webhook sends a sample POST
     * (orderCode 123). Always acknowledge with HTTP 200 or PayOS rejects the URL.
     */
    @GetMapping("/payos/webhook")
    public ResponseEntity<Map<String, Object>> payOsWebhookProbe() {
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/payos/webhook")
    public ResponseEntity<Map<String, Object>> handlePayOsWebhook(@RequestBody Map<String, Object> body) {
        try {
            payOsService.handlePayOsWebHook(body);
        } catch (Exception e) {
            // Still 200 so PayOS URL confirmation / retries do not fail the gateway setup.
            log.error("PayOS webhook processing failed: {}", e.getMessage(), e);
        }
        return ResponseEntity.ok(Map.of("success", true));
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
