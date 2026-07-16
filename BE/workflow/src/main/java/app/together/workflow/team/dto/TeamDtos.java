package app.together.workflow.team.dto;

import java.time.Instant;
import java.util.List;

public class TeamDtos {

    // ── Request DTOs ──

    public record CreateTeamRequest(
            String name,
            String description,
            String avatarUrl,
            Boolean isPrivate,
            Integer maxMembers) {
    }

    public record UpdateTeamRequest(
            String name,
            String description,
            String avatarUrl,
            Boolean isPrivate,
            Integer maxMembers) {
    }

    public record JoinTeamByCodeRequest(
            String inviteCode) {
    }

    public record AddMemberRequest(
            String userSso,
            String role) {
    }

    public record UpdateMemberRoleRequest(
            String role) {
    }

    // ── Response DTOs ──

    public record MemberPreview(
            String userSso,
            String nickname,
            String avatarUrl) {
    }

    public record TeamResponse(
            Long teamId,
            String name,
            String description,
            String avatarUrl,
            Boolean isPrivate,
            String inviteCode,
            Integer maxMembers,
            Integer currentMemberCount,
            Instant createdAt,
            List<MemberPreview> memberPreviews) {
    }

    public record TeamMemberResponse(
            Long teamId,
            String userSso,
            String role,
            String nickname,
            String avatarUrl,
            Instant joinedAt) {
    }

    public record TeamDetailResponse(
            TeamResponse team,
            List<TeamMemberResponse> members) {
    }
}
