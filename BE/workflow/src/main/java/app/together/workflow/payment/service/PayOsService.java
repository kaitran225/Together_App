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
import app.together.common.workflow.entity.SubscriptionPlan;
import app.together.common.workflow.entity.Transaction;
import app.together.common.workflow.entity.UserMasterData;
import app.together.common.workflow.enums.PaymentStatus;
import app.together.common.workflow.repository.CoinPackageRepository;
import app.together.common.workflow.repository.PaymentTransactionRepository;
import app.together.common.workflow.repository.TransactionRepository;
import app.together.common.workflow.repository.UserMasterDataRepository;
import app.together.workflow.payment.dto.PaymentDtos;
import app.together.workflow.payment.dto.PaymentDtos.*;
import app.together.common.workflow.dto.CoinPackageDto;
import app.together.common.workflow.mapper.CoinPackageMapper;
import app.together.common.auth.dto.UserWalletDto;
import app.together.common.auth.mapper.UserWalletMapper;
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
import java.util.List;
import java.util.stream.Collectors;

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
    private final CoinPackageMapper coinPackageMapper;
    private final UserWalletMapper userWalletMapper;
    private final SubscriptionService subscriptionService;

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
     * Retrieves all active coin packages ordered by display order.
     */
    public List<CoinPackageDto> getActiveCoinPackages() {
        return coinPackageRepository.findByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(coinPackageMapper::toDto)
                .collect(Collectors.toList());
    }

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
        try {
            Map<String, Object> meta = new java.util.HashMap<>();
            meta.put("productType", "COIN_PACKAGE");
            meta.put("packageId", coinPackage.getPackageId());
            saved.setMetadata(objectMapper.writeValueAsString(meta));
            paymentTransactionRepository.save(saved);
        } catch (Exception ignored) {
            // metadata optional for coin flow
        }

        String description = "NAP_COIN" + saved.getPaymentId();
        return createPayOsCheckout(saved, description);
    }

    /**
     * Tạo link thanh toán PayOS cho gói đăng ký (VND).
     */
    public CheckoutResponse createSubscriptionPaymentLink(String userSso, Long planId) {
        requireUserSso(userSso);
        SubscriptionPlan plan = subscriptionService.requireActivePlan(planId);

        PaymentTransaction transaction = PaymentTransaction.builder()
                .userSso(userSso)
                .transactionType(TransactionType.PURCHASE.name())
                .amount(BigDecimal.valueOf(plan.getPriceVnd()))
                .coinsAmount(0)
                .currency("VND")
                .paymentMethod("PAYOS")
                .status(PaymentStatus.PENDING.name())
                .build();

        PaymentTransaction saved = paymentTransactionRepository.save(transaction);
        try {
            Map<String, Object> meta = new java.util.HashMap<>();
            meta.put("productType", "SUBSCRIPTION");
            meta.put("planId", plan.getPlanId());
            meta.put("tierCode", plan.getTierCode());
            meta.put("durationDays", plan.getDurationDays() != null ? plan.getDurationDays() : 30);
            saved.setMetadata(objectMapper.writeValueAsString(meta));
            paymentTransactionRepository.save(saved);
        } catch (Exception e) {
            throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
        }

        String description = "GOI_" + plan.getTierCode() + saved.getPaymentId();
        if (description.length() > 25) {
            description = "SUB" + saved.getPaymentId();
        }
        return createPayOsCheckout(saved, description);
    }

    private CheckoutResponse createPayOsCheckout(PaymentTransaction saved, String description) {
        // PayOS orderCode must be globally unique across retries; payment_id reuses after rollbacks.
        long orderCode = System.currentTimeMillis();
        try {
            Map<String, Object> metaMap = new java.util.HashMap<>();
            if (saved.getMetadata() != null && !saved.getMetadata().isBlank()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> existing = objectMapper.readValue(saved.getMetadata(), Map.class);
                metaMap.putAll(existing);
            }
            metaMap.put("payosOrderCode", orderCode);
            saved.setMetadata(objectMapper.writeValueAsString(metaMap));
            paymentTransactionRepository.save(saved);
        } catch (Exception e) {
            throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
        }

        // 2. Tạo chữ ký Checksum cho đơn hàng của PayOS
        String signatureData = String.format("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                saved.getAmount().longValue(), cancelUrl, description, orderCode, returnUrl);

        String signature = hmacSha256(signatureData, payosChecksumKey);

        // 3. Gọi sang API của PayOS để khởi tạo VietQR thanh toán
        try {
            RestClient restClient = RestClient.create();
            Map<String, Object> body = Map.of(
                    "orderCode", orderCode,
                    "amount", saved.getAmount().longValue(),
                    "description", description,
                    "cancelUrl", cancelUrl,
                    "returnUrl", returnUrl,
                    "signature", signature
            );

            @SuppressWarnings("unchecked")
            Map<String, Object> payosResponse = restClient.post()
                    .uri(uriPayos)
                    .header("x-client-id", payosClient)
                    .header("x-api-key", payosApiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (payosResponse != null && "00".equals(payosResponse.get("code"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) payosResponse.get("data");
                String checkoutUrl = (String) data.get("checkoutUrl");
                String payosOrderId = data.get("paymentLinkId") != null
                        ? String.valueOf(data.get("paymentLinkId"))
                        : (String) data.get("payosOrderId");

                Map<String, Object> metaMap = new java.util.HashMap<>();
                if (saved.getMetadata() != null && !saved.getMetadata().isBlank()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> existing = objectMapper.readValue(saved.getMetadata(), Map.class);
                    metaMap.putAll(existing);
                }
                metaMap.put("checkoutUrl", checkoutUrl);
                saved.setMetadata(objectMapper.writeValueAsString(metaMap));
                saved.setPaymentGatewayId(payosOrderId);
                paymentTransactionRepository.save(saved);

                return new CheckoutResponse(saved.getPaymentId(),
                        checkoutUrl,
                        saved.getAmount(),
                        saved.getCoinsAmount());
            } else {
                log.error("PayOS rejected payment request: {}", payosResponse);
                throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
            }

        } catch (BadRequestException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to connect to PayOS gateway: {}", e.getMessage(), e);
            throw new BadRequestException(MessageConstants.MESSAGE_PAYMENT_TRANSACTION_INVALID);
        }
    }

    /**
     * Xử lý Webhook (Callback) tự động gọi về khi chuyển khoản thành công.
     * PayOS also POSTs a sample payload when confirming the webhook URL — unknown
     * orderCodes must be acknowledged without error.
     */
    @SuppressWarnings("unchecked")
    public void handlePayOsWebHook(Map<String, Object> body) {
        if (body == null || body.isEmpty()) {
            return;
        }
        Object dataObj = body.get("data");
        if (!(dataObj instanceof Map<?, ?> dataRaw)) {
            log.info("PayOS webhook without data map — acknowledging");
            return;
        }
        Map<String, Object> data = (Map<String, Object>) dataRaw;
        String signature = body.get("signature") != null ? String.valueOf(body.get("signature")) : null;

        if (!verifyWebhookDataSignature(data, signature)) {
            log.warn("PayOS webhook signature mismatch — acknowledging without fulfilling");
            return;
        }

        Long orderCode = toLong(data.get("orderCode"));
        if (orderCode == null) {
            log.info("PayOS webhook missing orderCode — acknowledging");
            return;
        }

        PaymentTransaction transaction = paymentTransactionRepository.findById(orderCode)
                .or(() -> paymentTransactionRepository.findByPayOsOrderCode(orderCode))
                .orElse(null);
        if (transaction == null) {
            // Sample confirm payload uses orderCode=123 which is not in our DB.
            log.info("PayOS webhook for unknown orderCode {} — acknowledging (confirm sample?)", orderCode);
            return;
        }

        String status = data.get("status") != null ? String.valueOf(data.get("status")) : null;
        String dataCode = data.get("code") != null ? String.valueOf(data.get("code")) : null;
        boolean paid = "PAID".equalsIgnoreCase(status) || "00".equals(dataCode);
        if (!paid || !PaymentStatus.PENDING.name().equals(transaction.getStatus())) {
            log.info("PayOS webhook orderCode {} ignored (status={}, code={}, txStatus={})",
                    orderCode, status, dataCode, transaction.getStatus());
            return;
        }

        Instant now = Instant.now();
        transaction.setStatus(TransactionType.PAID.name());
        transaction.setPaidAt(now);
        paymentTransactionRepository.save(transaction);

        String productType = "COIN_PACKAGE";
        Long planId = null;
        try {
            if (transaction.getMetadata() != null && !transaction.getMetadata().isBlank()) {
                Map<String, Object> meta = objectMapper.readValue(transaction.getMetadata(), Map.class);
                if (meta.get("productType") != null) {
                    productType = String.valueOf(meta.get("productType"));
                }
                if (meta.get("planId") != null) {
                    planId = Long.valueOf(String.valueOf(meta.get("planId")));
                }
            }
        } catch (Exception e) {
            log.warn("Unable to parse payment metadata for #{}: {}", transaction.getPaymentId(), e.getMessage());
        }

        if ("SUBSCRIPTION".equalsIgnoreCase(productType)) {
            fulfillSubscriptionPayment(transaction, planId);
        } else {
            fulfillCoinPayment(transaction, now);
        }
    }

    /**
     * PayOS signs the full {@code data} object: all keys sorted alphabetically,
     * null → empty string, then HMAC-SHA256 with checksum key.
     */
    private boolean verifyWebhookDataSignature(Map<String, Object> data, String signature) {
        if (signature == null || signature.isBlank() || data == null) {
            return false;
        }
        Map<String, Object> sorted = new TreeMap<>(data);
        StringBuilder rawData = new StringBuilder();
        for (Map.Entry<String, Object> e : sorted.entrySet()) {
            if (rawData.length() > 0) {
                rawData.append('&');
            }
            Object value = e.getValue();
            String asString;
            if (value == null || "null".equalsIgnoreCase(String.valueOf(value))
                    || "undefined".equalsIgnoreCase(String.valueOf(value))) {
                asString = "";
            } else {
                asString = String.valueOf(value);
            }
            rawData.append(e.getKey()).append('=').append(asString);
        }
        String calculated = hmacSha256(rawData.toString(), payosChecksumKey);
        return calculated.equalsIgnoreCase(signature);
    }

    private Long toLong(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void fulfillSubscriptionPayment(PaymentTransaction transaction, Long planId) {
        if (planId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NOT_FOUND);
        }
        SubscriptionPlan plan = subscriptionService.requireActivePlan(planId);
        subscriptionService.applyPaidPlan(transaction.getUserSso(), plan);

        UserMasterData masterData = userMasterDataRepository.findByUserSso(transaction.getUserSso())
                .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(transaction.getUserSso()).build()));

        transactionRepository.save(Transaction.builder()
                .userMasterDataId(masterData.getMasterDataId())
                .amount(transaction.getAmount() != null ? transaction.getAmount().intValue() : 0)
                .type(TransactionType.PURCHASE.name())
                .category("SUBSCRIPTION_PURCHASE")
                .description("Mua gói " + plan.getName() + " qua PayOS - hóa đơn #" + transaction.getPaymentId())
                .build());

        log.info("Successfully processed PayOS subscription payment #{} for userSso {} -> tier {}",
                transaction.getPaymentId(), transaction.getUserSso(), plan.getTierCode());
    }

    private void fulfillCoinPayment(PaymentTransaction transaction, Instant now) {
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

            int coins = transaction.getCoinsAmount() != null ? transaction.getCoinsAmount() : 0;
            wallet.setBalance(wallet.getBalance() + coins);
            wallet.setLifetimeEarned(wallet.getLifetimeEarned() + coins);
            wallet.setLastTransactionAt(now);
            userWalletRepository.save(wallet);

            // 4. Tìm kiếm userMasterDataId từ userSso để ghi nhận vào sổ cái local (Transactions) của bạn
            UserMasterData masterData = userMasterDataRepository.findByUserSso(transaction.getUserSso())
                    .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(transaction.getUserSso()).build()));

            transactionRepository.save(Transaction.builder()
                    .userMasterDataId(masterData.getMasterDataId())
                    .amount(coins)
                    .type(TransactionType.PURCHASE.name())
                    .category("COIN_PURCHASE")
                    .description("Nạp Coin thành công qua PayOS cho hóa đơn #" + transaction.getPaymentId())
                    .build());

            log.info("Successfully processed PayOS payment for transaction #{}. Credited {} coins to userSso {}.",
                    transaction.getPaymentId(), coins, transaction.getUserSso());
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

    public UserWalletDto getUserWallet(String userSso) {
        requireUserSso(userSso);
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_USER_NOT_FOUND, userSso));
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
        return userWalletMapper.toDto(wallet);
    }

    @Transactional(readOnly = true)
    public List<PaymentDtos.TransactionResponse> getMyTransactions(String userSso) {
        requireUserSso(userSso);
        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso).orElse(null);
        if (masterData == null) {
            return List.of();
        }

        return transactionRepository.findByUserMasterDataIdOrderByCreatedAtDesc(masterData.getMasterDataId())
                .stream()
                .map(t -> new PaymentDtos.TransactionResponse(
                        t.getTransactionId(),
                        t.getAmount(),
                        t.getType(),
                        t.getCategory(),
                        t.getDescription(),
                        t.getCreatedAt()))
                .toList();
    }

}
