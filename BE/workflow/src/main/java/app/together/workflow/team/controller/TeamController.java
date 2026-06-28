package app.together.workflow.team.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.team.dto.TeamDtos.*;
import app.together.workflow.team.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/workflow/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    public ApiResponse<TeamResponse> createTeam(@RequestBody CreateTeamRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.createTeam(userSso, request));
    }

    @GetMapping("/my")
    public ApiResponse<List<TeamResponse>> getMyTeams() {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.getMyTeams(userSso));
    }

    @GetMapping("/{teamId}")
    public ApiResponse<TeamDetailResponse> getTeamDetail(@PathVariable Long teamId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.getTeamDetail(teamId, userSso));
    }

    @PutMapping("/{teamId}")
    public ApiResponse<TeamResponse> updateTeam(@PathVariable Long teamId,
            @RequestBody UpdateTeamRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.updateTeam(teamId, userSso, request));
    }

    @DeleteMapping("/{teamId}")
    public ApiResponse<Void> deleteTeam(@PathVariable Long teamId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        teamService.deleteTeam(teamId, userSso);
        return ApiResponse.ok(null);
    }

    @PostMapping("/join")
    public ApiResponse<TeamMemberResponse> joinByInviteCode(@RequestBody JoinTeamByCodeRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.joinTeamByInviteCode(userSso, request));
    }

    @PostMapping("/{teamId}/members")
    public ApiResponse<TeamMemberResponse> addMember(@PathVariable Long teamId,
            @RequestBody AddMemberRequest request) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.addMember(teamId, userSso, request));
    }

    @GetMapping("/{teamId}/members")
    public ApiResponse<List<TeamMemberResponse>> getMembers(@PathVariable Long teamId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.getMembers(teamId, userSso));
    }

    @DeleteMapping("/{teamId}/members/{targetUserSso}")
    public ApiResponse<Void> removeMember(@PathVariable Long teamId, @PathVariable String targetUserSso) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        teamService.removeMember(teamId, userSso, targetUserSso);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{teamId}/leave")
    public ApiResponse<Void> leaveTeam(@PathVariable Long teamId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        teamService.leaveTeam(teamId, userSso);
        return ApiResponse.ok(null);
    }

    @PostMapping("/{teamId}/regenerate-invite")
    public ApiResponse<TeamResponse> regenerateInviteCode(@PathVariable Long teamId) {
        String userSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(teamService.regenerateInviteCode(teamId, userSso));
    }
}
