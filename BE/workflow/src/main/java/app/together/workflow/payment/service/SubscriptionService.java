package app.together.workflow.payment.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.entity.UserWallet;
import app.together.common.auth.repository.UserRepository;
import app.together.common.auth.repository.UserWalletRepository;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.enums.TransactionType;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Transaction;
import app.together.common.workflow.entity.UserMasterData;
import app.together.common.workflow.repository.TransactionRepository;
import app.together.common.workflow.repository.UserMasterDataRepository;
import app.together.workflow.payment.dto.SubscriptionDtos.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionService {

    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final UserMasterDataRepository userMasterDataRepository;
    private final TransactionRepository transactionRepository;

    // Bảng giá quy đổi gói nâng cấp ra Coin
    private static final Map<String, Integer> TIER_PRICE_PER_DAY = Map.of(
            "PRO", 5,
            "TEAM", 10,
            "PLUS", 15
    );

    /**
     * Người dùng tự thực hiện nâng cấp/gia hạn Gói dịch vụ bằng số Coin đang có trong ví.
     */
    public SubscriptionResponse upgradeUserTier(String userSso, UpgradeTierRequest request){
        String targetTier = request.targetTier().trim().toUpperCase();
        if(!TIER_PRICE_PER_DAY.containsKey(targetTier)){
            throw new BadRequestException(MessageConstants.MESSAGE_COIN_PACKAGE_INVALID);
        }

        int durationDays = request.durationDays() != null ? request.durationDays() : 30;
        if(durationDays <= 0){
            throw new BadRequestException(MessageConstants.MESSAGE_DURATION_INVALID);
        }

        // 1. Tính toán chi phí số Coin cần trừ
        int pricePerDay = TIER_PRICE_PER_DAY.get(targetTier);
        int totalCostCoins = pricePerDay * durationDays;

        // 2. Tìm User trước để lấy userId cho việc truy vấn ví
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_USER_NOT_FOUND));

        // 3. Kiểm tra số dư ví Coin của người dùng
        UserWallet wallet = userWalletRepository.findByUserId(user.getUserId())
                .orElseThrow(() -> new BadRequestException((MessageConstants.MESSAGE_USER_WALLET_NOT_FOUND)));

        if(wallet.getBalance() < totalCostCoins){
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_ENOUGH_COINS);
        }

        // 4. Thực hiện trừ Coin ví (Có khóa lạc quan bảo vệ)
        wallet.setBalance(wallet.getBalance() - totalCostCoins);
        wallet.setLifetimeSpent(wallet.getLifetimeSpent() + totalCostCoins);
        wallet.setLastTransactionAt(Instant.now());
        userWalletRepository.save(wallet);

        Instant currentExpiry = user.getPlanExpiresAt();
        Instant newExpiry;

        // Nếu gói hiện tại vẫn còn hạn và người dùng gia hạn đúng gói đó -> Cộng dồn ngày
        if (currentExpiry != null && currentExpiry.isAfter(Instant.now()) && targetTier.equals(user.getPlanType())) {
            newExpiry = currentExpiry.plus(durationDays, ChronoUnit.DAYS);
        } else {
            // Ngược lại (mua mới hoặc nâng cấp gói khác) -> Tính từ thời điểm hiện tại
            newExpiry = Instant.now().plus(durationDays, ChronoUnit.DAYS);
        }

        user.setPlanType(targetTier);
        user.setPlanExpiresAt(newExpiry);
        userRepository.save(user);

        // 5. Ghi nhận nhật ký biến động ví tiền local (Transactions)
        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_USER_MASTER_DATA_NOT_FOUND));

        transactionRepository.save(Transaction.builder()
                        .userMasterDataId(masterData.getMasterDataId())
                        .amount(-totalCostCoins)
                        .type(TransactionType.SPEND.name())
                        .category("TIER_UPGRADE")
                        .description(String.format("Nâng cấp thành công gói %s hạn dùng %d ngày (Trừ %d Coin)"
                                , targetTier, durationDays, totalCostCoins))
                .build());

        return new SubscriptionResponse(userSso, targetTier, newExpiry, totalCostCoins, wallet.getBalance());
    }
}
