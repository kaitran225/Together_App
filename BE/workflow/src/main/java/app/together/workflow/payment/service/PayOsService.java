package app.together.workflow.payment.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.entity.UserWallet;
import app.together.common.auth.enums.WalletStatus;
import app.together.common.auth.repository.UserRepository;
import app.together.common.auth.repository.UserWalletRepository;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.enums.TransactionType;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.CoinPackage;
import app.together.common.workflow.entity.PaymentTransaction;
import app.together.common.workflow.entity.Transaction;
import app.together.common.workflow.entity.UserMasterData;
import app.together.common.workflow.enums.PaymentStatus;
import app.together.common.workflow.repository.CoinPackageRepository;
import app.together.common.workflow.repository.PaymentTransactionRepository;
import app.together.common.workflow.repository.TransactionRepository;
import app.together.common.workflow.repository.UserMasterDataRepository;
import app.together.workflow.payment.dto.PaymentDtos.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PayOsService {

    private final CoinPackageRepository coinPackageRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final UserWalletRepository userWalletRepository;
    private final UserMasterDataRepository userMasterDataRepository;
    private final TransactionRepository transactionRepository;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;

    @Value("${app.payment.payos.client-id}")
    private String payosClient;

    @Value("${app.payment.payos.api-key}")
    private String payosApiKey;

    @Value("${app.payment.payos.checksum-key}")
    private String payosChecksumKey;

    @Value("${app.payment.return-url}")
    private String returnUrl;

    @Value("${app.payment.cancel-url}")
    private String cancelUrl;

    private String uriPayos = "https://api-merchant.payos.vn/v2/payment-requests";

    /**
     * Tạo hóa đơn tạm và lấy link VietQR động của PayOS.
     */
    public CheckoutResponse createPaymentLink(String userSso, Long packageId) {
        requireUserSso(userSso);
        CoinPackage coinPackage = coinPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_COIN_PACKAGE_NOT_FOUND, packageId));

        if (!Boolean.TRUE.equals(coinPackage.getIsActive())) {
            throw new BadRequestException(MessageConstants.MESSAGE_COIN_PACKAGE_INVALID);
        }

        // Tính tổng số coin nhận được (cộng cả coin tặng kèm nếu có)
        int totalCoins = coinPackage.getCoinsAmount() + (coinPackage.getBonusCoins() != null
                ? coinPackage.getBonusCoins() : 0);

        // 1. Tạo hóa đơn tạm PENDING trong cơ sở dữ liệu
        PaymentTransaction transaction = PaymentTransaction.builder()
                .userSso(userSso)
                .transactionType(TransactionType.PURCHASE.name())
                .amount(BigDecimal.valueOf(coinPackage.getPriceVnd()))
                .coinsAmount(totalCoins)
                .currency("VND")
                .paymentMethod("PAYOS")
                .status(PaymentStatus.PENDING.name())
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);

        // 2. Tạo chữ ký Checksum cho đơn hàng của PayOS
        String signatureData = String.format("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                saved.getAmount().longValue(), cancelUrl, "NAP_COIN" + saved.getPaymentId(), saved.getPaymentId(), returnUrl);

        String signature = hmacSha256(signatureData, payosChecksumKey);

        // 3. Gọi sang API của PayOS để khởi tạo VietQR thanh toán
        try {
            RestClient restClient = RestClient.create();
            Map<String, Object> body = Map.of(
                    "orderCode", saved.getPaymentId(), // Dùng chính paymentId tự tăng của DB làm orderCode số nguyên
                    "amount", saved.getAmount().longValue(),
                    "description", "NAP_COIN" + saved.getPaymentId(),
                    "cancelUrl", cancelUrl,
                    "returnUrl", returnUrl,
                    "signature", signature
            );

            Map<String, Object> payosResponse = restClient.post()
                    .uri(uriPayos)
                    .header("x-client-id", payosClient)
                    .header("x-api-key", payosApiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (payosResponse != null && "00".equals(payosResponse.get("code"))) {
                Map<String, Object> data = (Map<String, Object>) payosResponse.get("data");
                String checkoutUrl = (String) data.get("checkoutUrl");
                String payosOrderId = (String) data.get("payosOrderId");

                // lưu checkoutUrl vào trong trường metadata định dạng JSONB
                Map<String, String> metaMap = Map.of("checkoutUrl", checkoutUrl);
                saved.setMetadata(objectMapper.writeValueAsString(metaMap));
                saved.setPaymentGatewayId(payosOrderId);
                paymentTransactionRepository.save(saved);

                return new CheckoutResponse(saved.getPaymentId(),
                        checkoutUrl,
                        saved.getAmount(),
                        saved.getCoinsAmount());
            } else {
                throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
            }

        } catch (Exception e) {
            log.error("Failed to connect to PayOS gateway: {}", e.getMessage());
            throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
        }
    }

    /**
     * Xử lý Webhook (Callback) tự động gọi về khi chuyển khoản thành công.
     */
    public void handlePayOsWebHook(PayOsWebhookPayload payload) {
        // 1. Kiểm tra chữ ký bảo mật từ Webhook PayOS
        if (!verifyWebhookSignature(payload.data(), payload.signature())) {
            log.warn("DETECTED MALICIOUS WEBHOOK CALL - SIGNATURE MISMATCH!");
            throw new BadRequestException(MessageConstants.MESSAGE_SIGNATURE_INVALID, payload.signature());
        }

        PayOsWebhookData data = payload.data();
        PaymentTransaction transaction = paymentTransactionRepository.findById(data.orderCode())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID, data.orderCode()));

        if (TransactionType.PAID.name().equals(data.status()) && PaymentStatus.PENDING.name().equals(transaction.getStatus())) {
            Instant now = Instant.now();

            // 2. Chuyển trạng thái giao dịch sang PAID
            transaction.setStatus(TransactionType.PAID.name());
            transaction.setPaidAt(now);
            paymentTransactionRepository.save(transaction);

            // 3. Tiến hành cộng Coin vào ví UserWallet (Auth Schema)
            User user = userRepository.findByUserSso(transaction.getUserSso())
                    .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_USER_NOT_FOUND, transaction.getUserSso()));

            UserWallet wallet = userWalletRepository.findByUserId(user.getUserId())
                    .orElseGet(() -> userWalletRepository.save(UserWallet.builder()
                            .userId(user.getUserId())
                            .balance(0)
                            .bonusBalance(0)
                            .pendingBalance(0)
                            .lifetimeEarned(0)
                            .lifetimeSpent(0)
                            .status(WalletStatus.ACTIVE)
                            .build()));

            wallet.setBalance(wallet.getBalance() + transaction.getCoinsAmount());
            wallet.setLifetimeEarned(wallet.getLifetimeEarned() + transaction.getCoinsAmount());
            wallet.setLastTransactionAt(now);
            userWalletRepository.save(wallet);

            // 4. Tìm kiếm userMasterDataId từ userSso để ghi nhận vào sổ cái local (Transactions) của bạn
            UserMasterData masterData = userMasterDataRepository.findByUserSso(transaction.getUserSso())
                    .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(transaction.getUserSso()).build()));

            transactionRepository.save(Transaction.builder()
                    .userMasterDataId(masterData.getMasterDataId())
                    .amount(transaction.getCoinsAmount())
                    .type(TransactionType.PURCHASE.name())
                    .category("COIN_PURCHASE")
                    .description("Nạp Coin thành công qua PayOS cho hóa đơn #" + transaction.getPaymentId())
                    .build());

            log.info("Successfully processed PayOS payment for transaction #{}. Credited {} coins to userSso {}.",
                    transaction.getPaymentId(), transaction.getCoinsAmount(), transaction.getUserSso());
        }
    }


    private boolean verifyWebhookSignature(PayOsWebhookData data, String signature) {
        Map<String, Object> sortedMap = new TreeMap<>();
        sortedMap.put("amount", data.amount());
        sortedMap.put("accountNumber", "");
        sortedMap.put("description", data.description());
        sortedMap.put("orderCode", data.orderCode());
        sortedMap.put("paymentLinkId", data.paymentLinkId());
        sortedMap.put("reference", data.reference());
        sortedMap.put("status", data.status());

        StringBuilder rawData = new StringBuilder();
        sortedMap.forEach((key, value) -> {
            if (rawData.length() > 0) rawData.append("&");
            rawData.append(key).append("=").append(value != null ? value : "");
        });

        String calculatedSignature = hmacSha256(rawData.toString(), payosChecksumKey);
        return calculatedSignature.equals(signature);
    }

    private String hmacSha256(String data, String key) {
        try {
            Mac sha256HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256HMAC.init(secretKey);
            byte[] hash = sha256HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
        }
    }

    private void requireUserSso(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

}
