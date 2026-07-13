package app.together.workflow.personal.controller;

import app.together.common.auth.entity.User;
import app.together.common.auth.entity.UserWallet;
import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.AppConfig;
import app.together.common.workflow.entity.AuditLog;
import app.together.common.workflow.entity.CoinPackage;
import app.together.workflow.personal.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/personal/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

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

    @GetMapping("/audit-logs")
    public ApiResponse<List<AuditLog>> getAuditLogs() {
        return ApiResponse.ok(adminService.getAllAuditLogs());
    }

    // --- ADMIN OVERVIEW STATS ---
    @GetMapping("/overview")
    public ApiResponse<java.util.Map<String, Object>> getOverviewStats() {
        return ApiResponse.ok(adminService.getOverviewStats());
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
