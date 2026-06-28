package app.together.workflow.personal.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.entity.UserTransaction;
import app.together.common.auth.entity.UserWallet;
import app.together.common.auth.repository.UserRepository;
import app.together.common.auth.repository.UserTransactionRepository;
import app.together.common.auth.repository.UserWalletRepository;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.enums.TransactionType;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.AppConfig;
import app.together.common.workflow.entity.AuditLog;
import app.together.common.workflow.entity.CoinPackage;
import app.together.common.workflow.repository.AppConfigRepository;
import app.together.common.workflow.repository.AuditLogRepository;
import app.together.common.workflow.repository.CoinPackageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private final CoinPackageRepository coinPackageRepository;
    private final AuditLogRepository auditLogRepository;
    private final PermissionCheckService permissionCheckService;
    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final UserTransactionRepository userTransactionRepository;
    private final AppConfigRepository appConfigRepository;

    // --- QUẢN LÝ GÓI COIN (CRUD COIN PACKAGES) ---

    public CoinPackage createCoinPackage(CoinPackage coinPackage) {
        // Kiểm tra quyền ADMIN hệ thống trước khi thực thi
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_CONFIG_WRITE);

        if (coinPackage.getPackageName() == null || coinPackage.getPackageName().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_COIN_PACKAGE_NAME_REQUIRED);
        }
        return coinPackageRepository.save(coinPackage);
    }

    public CoinPackage updateCoinPackage(Long packageId, CoinPackage request) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_CONFIG_WRITE);

        CoinPackage coinPackage = coinPackageRepository.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("CoinPackage", packageId));

        coinPackage.setPackageName(request.getPackageName());
        coinPackage.setCoinsAmount(request.getCoinsAmount());
        coinPackage.setBonusCoins(request.getBonusCoins());
        coinPackage.setPriceVnd(request.getPriceVnd());
        coinPackage.setIsActive(request.getIsActive());
        coinPackage.setIsPopular(request.getIsPopular());
        coinPackage.setDisplayOrder(request.getDisplayOrder());
        coinPackage.setDescription(request.getDescription());

        return coinPackageRepository.save(coinPackage);
    }

    // --- TRA CỨU LỊCH SỬ THAY ĐỔI HỆ THỐNG (AUDIT LOGS) ---

    @Transactional(readOnly = true)
    public List<AuditLog> getAllAuditLogs() {
        // Yêu cầu quyền đọc lịch sử hệ thống của Admin
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        return auditLogRepository.findAll();
    }

    // QUẢN LÝ THAM SỐ CẤU HÌNH ĐỘNG (SYSTEM CONFIG) ---

    public AppConfig setSystemConfig(String key, String value, String description, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_CONFIG_WRITE);

        AppConfig config = appConfigRepository.findById(key)
                .orElseGet(() -> AppConfig.builder().configKey(key).build());

        config.setValue(value.trim());
        if (description != null) {
            config.setDescription(description.trim());
        }
        config.setUpdatedBy(adminSso);

        return appConfigRepository.save(config);
    }

    //  HỖ TRỢ VÍ: CỘNG/TRỪ COIN THỦ CÔNG (ADMIN REFUND/ADJUSTMENT) ---

    public UserWallet adjustUserWallet(String targetUserSso, int amount, String reason, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        UserWallet wallet = userWalletRepository.findByUserId(Long.valueOf(targetUserSso))
                .orElseThrow(() -> new ResourceNotFoundException("UserWallet", targetUserSso));

        int oldBalance = wallet.getBalance();
        int newBalance = oldBalance + amount;
        if (newBalance < 0) {
            throw new BadRequestException("Giao dịch điều chỉnh thất bại. Số dư ví sau điều chỉnh không thể âm.");
        }

        wallet.setBalance(newBalance);
        wallet.setLastTransactionAt(Instant.now());
        wallet.setUpdatedBy(adminSso);
        UserWallet savedWallet = userWalletRepository.save(wallet);

        // Ghi sổ cái minh bạch dòng tiền do Admin can thiệp
        userTransactionRepository.save(UserTransaction.builder()
                .userId(wallet.getUserId())
                .walletId(wallet.getWalletId())
                .amount(amount)
                .balanceAfter(newBalance)
                .type(amount > 0 ? TransactionType.BONUS : TransactionType.SPEND)
                .referenceType("ADMIN_ADJUSTMENT")
                .referenceId(adminSso)
                .description(reason != null ? reason : "Điều chỉnh thủ công từ Quản trị viên hệ thống.")
                .build());

        return savedWallet;
    }

    //  KHÓA TÀI KHOẢN NGƯỜI DÙNG VI PHẠM (BAN USER) ---

    public User changeUserStatus(String targetUserSso, String status, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        User user = userRepository.findById(Long.valueOf(targetUserSso))
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserSso));

        // Ví dụ trạng thái: ACTIVE, BANNED, SUSPENDED
        user.setStatus(status.trim().toUpperCase());
        user.setUpdatedBy(adminSso);

        return userRepository.save(user);
    }


}
