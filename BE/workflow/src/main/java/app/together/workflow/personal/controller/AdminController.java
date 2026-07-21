package app.together.workflow.personal.controller;

import app.together.common.auth.entity.User;
import app.together.common.auth.entity.UserWallet;
import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.AppConfig;
import app.together.common.workflow.entity.AuditLog;
import app.together.common.workflow.entity.CoinPackage;
import app.together.common.workflow.entity.SubscriptionPlan;
import app.together.workflow.personal.dto.AdminUserDtos.AdminUserResponse;
import app.together.workflow.personal.dto.AdminUserDtos.CreateUserRequest;
import app.together.workflow.personal.dto.AdminUserDtos.UpdateUserProfileRequest;
import app.together.workflow.personal.dto.AdminUserDtos.UpdateUserRoleRequest;
import app.together.workflow.personal.dto.SupportDtos.SendSupportMessageRequest;
import app.together.workflow.personal.dto.SupportDtos.SupportConversationResponse;
import app.together.workflow.personal.dto.SupportDtos.SupportMessageResponse;
import app.together.workflow.personal.service.AdminService;
import app.together.workflow.personal.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final SupportService supportService;

    // --- CẤU HÌNH THAM SỐ HỆ THỐNG ---
    @PostMapping("/configs")
    public ApiResponse<AppConfig> setConfig(
            @RequestParam("key") String key,
            @RequestParam("value") String value,
            @RequestParam(value = "description", required = false) String description) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.setSystemConfig(key, value, description, adminSso));
    }

    // --- ĐIỀU CHỈNH VÍ COIN THỦ CÔNG ---
    @PostMapping("/users/{userSso}/adjust-wallet")
    public ApiResponse<UserWallet> adjustWallet(
            @PathVariable String userSso,
            @RequestParam("amount") int amount,
            @RequestParam(value = "reason", required = false) String reason) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.adjustUserWallet(userSso, amount, reason, adminSso));
    }

    // --- KHÓA TÀI KHOẢN NGƯỜI DÙNG VI PHẠM ---
    @PostMapping("/users/{userSso}/change-status")
    public ApiResponse<User> changeUserStatus(
            @PathVariable String userSso,
            @RequestParam("status") String status) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.changeUserStatus(userSso, status, adminSso));
    }

    @PostMapping("/coin-packages")
    public ApiResponse<CoinPackage> createPackage(@RequestBody CoinPackage coinPackage) {
        return ApiResponse.ok(adminService.createCoinPackage(coinPackage));
    }

    @PutMapping("/coin-packages/{packageId}")
    public ApiResponse<CoinPackage> updatePackage(@PathVariable Long packageId, @RequestBody CoinPackage request) {
        return ApiResponse.ok(adminService.updateCoinPackage(packageId, request));
    }

    // --- QUẢN LÝ GÓI SUBSCRIPTION ---
    @GetMapping("/subscription-plans")
    public ApiResponse<List<SubscriptionPlan>> listSubscriptionPlans() {
        return ApiResponse.ok(adminService.listSubscriptionPlans());
    }

    @PostMapping("/subscription-plans")
    public ApiResponse<SubscriptionPlan> createSubscriptionPlan(@RequestBody SubscriptionPlan plan) {
        return ApiResponse.ok(adminService.createSubscriptionPlan(plan));
    }

    @PutMapping("/subscription-plans/{planId}")
    public ApiResponse<SubscriptionPlan> updateSubscriptionPlan(@PathVariable Long planId, @RequestBody SubscriptionPlan request) {
        return ApiResponse.ok(adminService.updateSubscriptionPlan(planId, request));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<List<AuditLog>> getAuditLogs() {
        return ApiResponse.ok(adminService.getAllAuditLogs());
    }

    // --- ADMIN OVERVIEW STATS ---
    @GetMapping("/overview")
    public ApiResponse<java.util.Map<String, Object>> getOverviewStats() {
        return ApiResponse.ok(adminService.getOverviewStats());
    }

    @GetMapping("/overview/user-growth")
    public ApiResponse<List<java.util.Map<String, Object>>> getUserGrowth(
            @RequestParam(value = "months", defaultValue = "6") int months) {
        return ApiResponse.ok(adminService.getUserGrowthByMonth(months));
    }

    @GetMapping("/overview/plan-distribution")
    public ApiResponse<List<java.util.Map<String, Object>>> getPlanDistribution() {
        return ApiResponse.ok(adminService.getPlanDistribution());
    }

    // --- ADMIN ALL ROOMS ---
    @GetMapping("/rooms")
    public ApiResponse<List<java.util.Map<String, Object>>> getAllRooms() {
        return ApiResponse.ok(adminService.getAllRoomsForAdmin());
    }

    // --- ADMIN REVENUE KPIs ---
    @GetMapping("/revenue/kpis")
    public ApiResponse<java.util.Map<String, Object>> getRevenueKpis() {
        return ApiResponse.ok(adminService.getRevenueKpis());
    }

    @GetMapping("/revenue/over-time")
    public ApiResponse<List<java.util.Map<String, Object>>> getRevenueOverTime(
            @RequestParam(value = "months", defaultValue = "6") int months) {
        return ApiResponse.ok(adminService.getRevenueOverTime(months));
    }

    @GetMapping("/revenue/distribution")
    public ApiResponse<List<java.util.Map<String, Object>>> getRevenueDistribution() {
        return ApiResponse.ok(adminService.getRevenueDistribution());
    }

    // --- ADMIN USER MANAGEMENT (create, edit, assign role) ---
    @PostMapping("/users")
    public ApiResponse<AdminUserResponse> createUser(@RequestBody CreateUserRequest request) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.createUserByAdmin(request, adminSso));
    }

    @PutMapping("/users/{userSso}/role")
    public ApiResponse<AdminUserResponse> updateUserRole(
            @PathVariable String userSso,
            @RequestBody UpdateUserRoleRequest request) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.updateUserRole(userSso, request.systemRole(), adminSso));
    }

    @PutMapping("/users/{userSso}")
    public ApiResponse<AdminUserResponse> updateUserProfile(
            @PathVariable String userSso,
            @RequestBody UpdateUserProfileRequest request) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.updateUserProfile(userSso, request, adminSso));
    }

    @PutMapping("/users/{userSso}/plan")
    public ApiResponse<AdminUserResponse> updateUserPlan(
            @PathVariable String userSso,
            @RequestBody app.together.workflow.personal.dto.AdminUserDtos.UpdateUserPlanRequest request) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.updateUserPlan(userSso, request, adminSso));
    }

    @PostMapping("/rooms/{roomId}/force-close")
    public ApiResponse<java.util.Map<String, Object>> forceCloseRoom(@PathVariable Long roomId) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.forceCloseRoom(roomId, adminSso));
    }

    // --- ADMIN SUPPORT (real-time-ish support chat) ---
    @GetMapping("/support/conversations")
    public ApiResponse<List<SupportConversationResponse>> listSupportConversations() {
        return ApiResponse.ok(supportService.listConversationsForAdmin());
    }

    @GetMapping("/support/conversations/{userSso}")
    public ApiResponse<List<SupportMessageResponse>> getSupportConversation(@PathVariable String userSso) {
        return ApiResponse.ok(supportService.getConversationForAdmin(userSso));
    }

    @PostMapping("/support/conversations/{userSso}/messages")
    public ApiResponse<SupportMessageResponse> replyToSupportConversation(
            @PathVariable String userSso,
            @RequestBody SendSupportMessageRequest request) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(supportService.sendMessageAsAdmin(userSso, request.message(), adminSso));
    }

    // --- ADMIN MODERATION & REPORTS ---
    @GetMapping("/reported-users")
    public ApiResponse<List<java.util.Map<String, Object>>> getReportedUsers() {
        return ApiResponse.ok(adminService.getReportedUsers());
    }

    @PostMapping("/reported-users/{userSso}/ban")
    public ApiResponse<Void> banReportedUser(@PathVariable String userSso) {
        String adminSso = SecurityUtils.requireCurrentUserSso();
        adminService.banReportedUser(userSso, adminSso);
        return ApiResponse.ok(null);
    }

    @PostMapping("/reported-users/report")
    public ApiResponse<app.together.common.workflow.entity.UserReport> createReport(
            @RequestParam("reportedUserSso") String reportedUserSso,
            @RequestParam("reason") String reason,
            @RequestParam(value = "roomId", required = false) Long roomId) {
        String reporterSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(adminService.createReport(reporterSso, reportedUserSso, reason, roomId));
    }
}
