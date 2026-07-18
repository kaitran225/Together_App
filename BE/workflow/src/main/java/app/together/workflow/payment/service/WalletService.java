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
import app.together.common.workflow.entity.Transaction;
import app.together.common.workflow.entity.UserMasterData;
import app.together.common.workflow.repository.TransactionRepository;
import app.together.common.workflow.repository.UserMasterDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Điểm tập trung duy nhất để cộng/trừ Coin trong ví người dùng — dùng chung cho
 * thành tựu, lên cấp, và các tính năng thu phí Coin — tránh lặp lại logic
 * get-or-create ví + ghi sổ cái Transaction ở nhiều nơi.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class WalletService {

    /** Soft-launch welcome coins so FREE users can try AI chat (25 coins / hour window). */
    public static final int WELCOME_COINS = 100;

    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final UserMasterDataRepository userMasterDataRepository;
    private final TransactionRepository transactionRepository;

    public UserWallet getOrCreateWallet(User user) {
        return userWalletRepository.findByUserId(user.getUserId())
                .map(existing -> grantWelcomeIfEmpty(existing, user))
                .orElseGet(() -> {
                    UserWallet created = userWalletRepository.save(UserWallet.builder()
                            .userId(user.getUserId())
                            .balance(WELCOME_COINS)
                            .bonusBalance(0)
                            .pendingBalance(0)
                            .lifetimeEarned(WELCOME_COINS)
                            .lifetimeSpent(0)
                            .status(WalletStatus.ACTIVE)
                            .build());
                    recordWelcome(user);
                    return created;
                });
    }

    private UserWallet grantWelcomeIfEmpty(UserWallet wallet, User user) {
        int balance = wallet.getBalance() != null ? wallet.getBalance() : 0;
        int earned = wallet.getLifetimeEarned() != null ? wallet.getLifetimeEarned() : 0;
        int spent = wallet.getLifetimeSpent() != null ? wallet.getLifetimeSpent() : 0;
        if (balance == 0 && earned == 0 && spent == 0) {
            wallet.setBalance(WELCOME_COINS);
            wallet.setLifetimeEarned(WELCOME_COINS);
            userWalletRepository.save(wallet);
            recordWelcome(user);
        }
        return wallet;
    }

    private void recordWelcome(User user) {
        if (user.getUserSso() != null && !user.getUserSso().isBlank()) {
            recordTransaction(user.getUserSso(), WELCOME_COINS, TransactionType.EARN.name(),
                    "WELCOME", "Coin chào mừng");
        }
    }

    public void credit(String userSso, int amount, String category, String description) {
        if (amount <= 0) {
            return;
        }
        User user = requireUser(userSso);
        UserWallet wallet = getOrCreateWallet(user);
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setLifetimeEarned(wallet.getLifetimeEarned() + amount);
        wallet.setLastTransactionAt(Instant.now());
        userWalletRepository.save(wallet);

        recordTransaction(userSso, amount, TransactionType.EARN.name(), category, description);
    }

    public void debit(String userSso, int amount, String category, String description) {
        if (amount <= 0) {
            return;
        }
        User user = requireUser(userSso);
        UserWallet wallet = getOrCreateWallet(user);
        if (wallet.getBalance() < amount) {
            throw new BadRequestException(MessageConstants.MESSAGE_NOT_ENOUGH_COINS);
        }
        wallet.setBalance(wallet.getBalance() - amount);
        wallet.setLifetimeSpent(wallet.getLifetimeSpent() + amount);
        wallet.setLastTransactionAt(Instant.now());
        userWalletRepository.save(wallet);

        recordTransaction(userSso, -amount, TransactionType.SPEND.name(), category, description);
    }

    private void recordTransaction(String userSso, int amount, String type, String category, String description) {
        UserMasterData masterData = userMasterDataRepository.findByUserSso(userSso)
                .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(userSso).build()));

        transactionRepository.save(Transaction.builder()
                .userMasterDataId(masterData.getMasterDataId())
                .amount(amount)
                .type(type)
                .category(category)
                .description(description)
                .build());
    }

    private User requireUser(String userSso) {
        return userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", userSso));
    }
}
