package app.together.workflow.personal.service;

import app.together.common.auth.entity.User;
import app.together.common.auth.entity.UserTransaction;
import app.together.common.auth.entity.UserWallet;
import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.enums.UserTier;
import app.together.common.auth.repository.UserRepository;
import app.together.common.auth.repository.UserTransactionRepository;
import app.together.common.auth.repository.UserWalletRepository;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.enums.TransactionType;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ConflictException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.AppConfig;
import app.together.common.workflow.entity.AuditLog;
import app.together.common.workflow.entity.CoinPackage;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.entity.SubscriptionPlan;
import app.together.common.workflow.enums.RoomRequestStatus;
import app.together.common.workflow.enums.UserStatus;
import app.together.common.workflow.repository.AppConfigRepository;
import app.together.common.workflow.repository.AuditLogRepository;
import app.together.common.workflow.repository.CoinPackageRepository;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.SubscriptionPlanRepository;
import app.together.common.workflow.repository.UserReportRepository;
import app.together.common.workflow.repository.UserRoomSlotRepository;
import app.together.common.workflow.entity.UserReport;
import app.together.workflow.personal.dto.AdminUserDtos.AdminUserResponse;
import app.together.workflow.personal.dto.AdminUserDtos.CreateUserRequest;
import app.together.workflow.personal.dto.AdminUserDtos.UpdateUserPlanRequest;
import app.together.workflow.personal.dto.AdminUserDtos.UpdateUserProfileRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

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
    private final app.together.common.workflow.repository.RoomRepository roomRepository;
    private final app.together.common.workflow.repository.PaymentTransactionRepository paymentTransactionRepository;
    private final UserReportRepository userReportRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final UserRoomSlotRepository userRoomSlotRepository;

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
        if (request.getFeatures() != null) {
            coinPackage.setFeatures(request.getFeatures());
        }

        return coinPackageRepository.save(coinPackage);
    }

    // --- QUẢN LÝ GÓI SUBSCRIPTION (CRUD SUBSCRIPTION PLANS) ---

    @Transactional(readOnly = true)
    public List<SubscriptionPlan> listSubscriptionPlans() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_CONFIG_WRITE);
        return subscriptionPlanRepository.findAllByOrderByDisplayOrderAsc();
    }

    public SubscriptionPlan createSubscriptionPlan(SubscriptionPlan plan) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_CONFIG_WRITE);

        if (plan.getName() == null || plan.getName().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NAME_REQUIRED);
        }
        if (plan.getPriceVnd() == null || plan.getPriceVnd() <= 0) {
            throw new BadRequestException(MessageConstants.MESSAGE_SUBSCRIPTION_PLAN_NAME_REQUIRED);
        }
        if (plan.getIsPopular() == null) {
            plan.setIsPopular(false);
        }
        return subscriptionPlanRepository.save(plan);
    }

    public SubscriptionPlan updateSubscriptionPlan(Long planId, SubscriptionPlan request) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_CONFIG_WRITE);

        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", planId));

        plan.setName(request.getName());
        plan.setTierCode(request.getTierCode());
        plan.setDescription(request.getDescription());
        plan.setPriceVnd(request.getPriceVnd());
        plan.setDurationDays(request.getDurationDays());
        plan.setIsActive(request.getIsActive());
        plan.setIsPopular(request.getIsPopular());
        plan.setDisplayOrder(request.getDisplayOrder());
        plan.setFeatures(request.getFeatures());

        return subscriptionPlanRepository.save(plan);
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

        UserWallet wallet = userWalletRepository.findByUserSso(targetUserSso)
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

        User user = userRepository.findByUserSso(targetUserSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserSso));

        // Ví dụ trạng thái: ACTIVE, BANNED, SUSPENDED
        user.setStatus(status.trim().toUpperCase());
        user.setUpdatedBy(adminSso);

        return userRepository.save(user);
    }

    // --- ADMIN OVERVIEW STATS ---

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getOverviewStats() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        java.time.LocalDate activeSince = java.time.LocalDate.now().minusDays(30);
        long activeUsers = allUsers.stream()
                .filter(u -> u.getLastActiveDate() != null && !u.getLastActiveDate().isBefore(activeSince))
                .count();
        return java.util.Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers
        );
    }

    // --- ADMIN USER GROWTH (last N months, by user creation date) ---

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getUserGrowthByMonth(int months) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        return countByMonth(months, userRepository.findAll().stream()
                .map(User::getCreatedAt)
                .filter(java.util.Objects::nonNull)
                .toList());
    }

    // --- ADMIN PLAN DISTRIBUTION (current plan_type breakdown, all users) ---

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getPlanDistribution() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<User> allUsers = userRepository.findAll();
        java.util.Map<String, Long> byPlan = allUsers.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        u -> u.getPlanType() != null ? u.getPlanType() : "FREE",
                        java.util.LinkedHashMap::new,
                        java.util.stream.Collectors.counting()));
        return byPlan.entrySet().stream()
                .map(e -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("label", e.getKey());
                    m.put("value", e.getValue());
                    return m;
                })
                .toList();
    }

    // --- ADMIN REVENUE OVER TIME (last N months, by paid_at) ---

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getRevenueOverTime(int months) {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<app.together.common.workflow.entity.PaymentTransaction> paidPayments = paymentTransactionRepository.findAll().stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .toList();

        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        java.util.Map<java.time.YearMonth, Long> revenueByMonth = new java.util.LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            revenueByMonth.put(currentMonth.minusMonths(i), 0L);
        }
        for (app.together.common.workflow.entity.PaymentTransaction p : paidPayments) {
            java.time.Instant paidAt = p.getPaidAt() != null ? p.getPaidAt() : p.getCreatedAt();
            if (paidAt == null || p.getAmount() == null) continue;
            java.time.YearMonth ym = java.time.YearMonth.from(paidAt.atZone(java.time.ZoneOffset.UTC));
            if (revenueByMonth.containsKey(ym)) {
                revenueByMonth.merge(ym, p.getAmount().longValue(), Long::sum);
            }
        }
        return revenueByMonth.entrySet().stream()
                .map(e -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("label", monthLabel(e.getKey()));
                    m.put("value", e.getValue());
                    return m;
                })
                .toList();
    }

    // --- ADMIN REVENUE DISTRIBUTION (revenue summed by paying user's current plan) ---

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getRevenueDistribution() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<app.together.common.workflow.entity.PaymentTransaction> paidPayments = paymentTransactionRepository.findAll().stream()
                .filter(p -> "PAID".equals(p.getStatus()) && p.getAmount() != null)
                .toList();

        java.util.Map<String, Long> revenueByPlan = new java.util.LinkedHashMap<>();
        for (app.together.common.workflow.entity.PaymentTransaction p : paidPayments) {
            String plan = userRepository.findByUserSso(p.getUserSso())
                    .map(User::getPlanType)
                    .filter(pt -> pt != null && !pt.isBlank())
                    .orElse("FREE");
            revenueByPlan.merge(plan, p.getAmount().longValue(), Long::sum);
        }
        return revenueByPlan.entrySet().stream()
                .map(e -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("label", e.getKey());
                    m.put("value", e.getValue());
                    return m;
                })
                .toList();
    }

    private List<java.util.Map<String, Object>> countByMonth(int months, List<java.time.Instant> timestamps) {
        java.time.YearMonth currentMonth = java.time.YearMonth.now();
        java.util.Map<java.time.YearMonth, Long> counts = new java.util.LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            counts.put(currentMonth.minusMonths(i), 0L);
        }
        for (java.time.Instant ts : timestamps) {
            java.time.YearMonth ym = java.time.YearMonth.from(ts.atZone(java.time.ZoneOffset.UTC));
            if (counts.containsKey(ym)) {
                counts.merge(ym, 1L, Long::sum);
            }
        }
        return counts.entrySet().stream()
                .map(e -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("label", monthLabel(e.getKey()));
                    m.put("value", e.getValue());
                    return m;
                })
                .toList();
    }

    private String monthLabel(java.time.YearMonth ym) {
        return ym.getMonth().getDisplayName(java.time.format.TextStyle.SHORT, java.util.Locale.ENGLISH);
    }

    // --- ADMIN ALL ROOMS ---

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getAllRoomsForAdmin() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<Room> rooms = roomRepository.findAll();
        return rooms.stream().map(r -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("roomId", r.getRoomId());
            map.put("name", r.getTitle());
            map.put("status", r.getStatus());
            map.put("roomType", r.getRoomType());
            map.put("maxMembers", r.getMaxMembers());
            map.put("createdBy", r.getCreatedBy());
            map.put("createdAt", r.getCreatedAt());
            map.put("inviteCode", r.getInviteCode());
            return map;
        }).toList();
    }

    public java.util.Map<String, Object> forceCloseRoom(Long roomId, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("Room", roomId));

        String status = room.getStatus();
        if (RoomRequestStatus.EXPIRED.name().equals(status)
                || (status != null && status.toUpperCase().contains("CLOSE"))) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_ALREADY_CLOSED);
        }

        Instant now = Instant.now();
        room.setStatus(RoomRequestStatus.EXPIRED.name());
        room.setClosedAt(now);
        room.setClosedBy(adminSso);
        roomRepository.save(room);

        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        for (RoomMember member : members) {
            if (Boolean.TRUE.equals(member.getIsActive())) {
                member.setIsActive(false);
                member.setLeftAt(now);
                member.setLastActiveAt(now);
            }
        }
        roomMemberRepository.saveAll(members);

        if (room.getCreatedBy() != null) {
            userRoomSlotRepository.findById(room.getCreatedBy()).ifPresent(slot -> {
                if (slot.getUsedSlots() != null && slot.getUsedSlots() > 0) {
                    slot.setUsedSlots(slot.getUsedSlots() - 1);
                    userRoomSlotRepository.save(slot);
                }
            });
        }

        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("roomId", room.getRoomId());
        map.put("name", room.getTitle());
        map.put("status", room.getStatus());
        map.put("closedAt", room.getClosedAt());
        map.put("closedBy", room.getClosedBy());
        return map;
    }

    // --- ADMIN REVENUE KPIs ---

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getRevenueKpis() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<app.together.common.workflow.entity.PaymentTransaction> allPayments = paymentTransactionRepository.findAll();
        long totalRevenue = allPayments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .mapToLong(p -> p.getAmount() != null ? p.getAmount().longValue() : 0)
                .sum();
        long totalTransactions = allPayments.stream()
                .filter(p -> "PAID".equals(p.getStatus()))
                .count();
        return java.util.Map.of(
                "totalRevenue", totalRevenue,
                "totalTransactions", totalTransactions,
                "currency", "VND"
        );
    }

    // --- ADMIN MODERATION & REPORTS ---

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getReportedUsers() {
        permissionCheckService.requireSystemPermission(Permission.PLATFORM_AUDIT_READ);
        List<UserReport> reports = userReportRepository.findByStatus("PENDING");
        return reports.stream().map(r -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("reportId", r.getReportId());
            map.put("reporterSso", r.getReporterSso());
            map.put("reportedUserSso", r.getReportedUserSso());
            map.put("reason", r.getReason());
            map.put("roomId", r.getRoomId());
            map.put("status", r.getStatus());
            map.put("createdAt", r.getCreatedAt());

            userRepository.findByUserSso(r.getReportedUserSso()).ifPresent(u -> {
                map.put("username", u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUserSso());
                map.put("email", u.getEmail());
                map.put("userStatus", u.getStatus());
            });

            return map;
        }).toList();
    }

    public void banReportedUser(String userSso, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);
        changeUserStatus(userSso, "BANNED", adminSso);
        List<UserReport> reports = userReportRepository.findByStatus("PENDING");
        for (UserReport r : reports) {
            if (r.getReportedUserSso().equals(userSso)) {
                r.setStatus("RESOLVED");
                userReportRepository.save(r);
            }
        }
    }

    public UserReport createReport(String reporterSso, String reportedUserSso, String reason, Long roomId) {
        UserReport report = UserReport.builder()
                .reporterSso(reporterSso)
                .reportedUserSso(reportedUserSso)
                .reason(reason)
                .roomId(roomId)
                .status("PENDING")
                .build();
        return userReportRepository.save(report);
    }

    // --- ADMIN USER MANAGEMENT (create, edit, assign role) ---

    public AdminUserResponse createUserByAdmin(CreateUserRequest request, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        if (request.email() == null || request.email().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException(MessageConstants.MESSAGE_USER_EMAIL_ALREADY_EXISTS);
        }

        SystemRole systemRole = parseSystemRole(request.systemRole());

        User user = User.builder()
                .userSso(generateUserSso())
                .email(request.email().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .planType("FREE")
                .exp(0)
                .level(1)
                .metadata("{}")
                .emailVerified(true)
                .status(UserStatus.ACTIVE.name())
                .systemRole(systemRole)
                .build();
        user.setCreatedBy(adminSso);
        user.setUpdatedBy(adminSso);

        return toAdminUserResponse(userRepository.save(user));
    }

    public AdminUserResponse updateUserRole(String userSso, String systemRole, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", userSso));

        user.setSystemRole(parseSystemRole(systemRole));
        user.setUpdatedBy(adminSso);

        return toAdminUserResponse(userRepository.save(user));
    }

    public AdminUserResponse updateUserProfile(String userSso, UpdateUserProfileRequest request, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", userSso));

        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName().trim());
        }
        if (request.email() != null && !request.email().isBlank() && !request.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new ConflictException(MessageConstants.MESSAGE_USER_EMAIL_ALREADY_EXISTS);
            }
            user.setEmail(request.email().trim());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }
        user.setUpdatedBy(adminSso);

        return toAdminUserResponse(userRepository.save(user));
    }

    public AdminUserResponse updateUserPlan(String userSso, UpdateUserPlanRequest request, String adminSso) {
        permissionCheckService.requireSystemPermission(Permission.ORG_ADMIN_ACTIONS);

        if (request == null || request.planType() == null || request.planType().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_PLAN_TYPE_INVALID);
        }

        String normalized = request.planType().trim().toUpperCase();
        UserTier tier;
        try {
            tier = UserTier.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            tier = switch (normalized) {
                case "PERSONAL" -> UserTier.PLUS;
                case "TEAMS" -> UserTier.TEAM;
                case "COMBO" -> UserTier.COMBO;
                default -> throw new BadRequestException(MessageConstants.MESSAGE_PLAN_TYPE_INVALID);
            };
        }

        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException("User", userSso));

        user.setPlanType(tier.name());

        if (request.planExpiresAt() != null) {
            user.setPlanExpiresAt(request.planExpiresAt());
        } else if (tier == UserTier.FREE) {
            user.setPlanExpiresAt(null);
        } else if (request.durationDays() != null) {
            if (request.durationDays() <= 0) {
                throw new BadRequestException(MessageConstants.MESSAGE_DURATION_INVALID);
            }
            Instant base = user.getPlanExpiresAt() != null && user.getPlanExpiresAt().isAfter(Instant.now())
                    ? user.getPlanExpiresAt()
                    : Instant.now();
            user.setPlanExpiresAt(base.plus(request.durationDays(), ChronoUnit.DAYS));
        }

        user.setUpdatedBy(adminSso);
        return toAdminUserResponse(userRepository.save(user));
    }

    private SystemRole parseSystemRole(String systemRole) {
        if (systemRole == null || systemRole.isBlank()) {
            return SystemRole.USER;
        }
        try {
            return SystemRole.valueOf(systemRole.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid system role: " + systemRole);
        }
    }

    private String generateUserSso() {
        return "USER_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        return new AdminUserResponse(
                user.getUserId(),
                user.getUserSso(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getPlanType(),
                user.getStatus(),
                user.getSystemRole() == null ? null : user.getSystemRole().name(),
                user.getCreatedAt());
    }
}
