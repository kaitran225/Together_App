package app.together.workflow.team.service;

import app.together.common.auth.enums.TeamRole;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.auth.repository.UserRepository;
import app.together.common.workflow.entity.Team;
import app.together.common.workflow.entity.TeamMember;
import app.together.common.workflow.entity.TeamMemberId;
import app.together.common.workflow.repository.TeamMemberRepository;
import app.together.common.workflow.repository.TeamRepository;
import app.together.workflow.payment.service.FeatureUsageService;
import app.together.workflow.team.dto.TeamDtos.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PermissionCheckService permissionCheckService;
    private final UserRepository userRepository;
    private final FeatureUsageService featureUsageService;

    // ── Tạo Team mới ──

    public TeamResponse createTeam(String userSso, CreateTeamRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_NAME_REQUIRED);
        }
        featureUsageService.chargeIfFree(userSso, "TEAM_CREATE", 0);

        Team team = Team.builder()
                .name(request.name().trim())
                .description(request.description() != null ? request.description().trim() : null)
                .avatarUrl(request.avatarUrl())
                .isPrivate(request.isPrivate() != null ? request.isPrivate() : Boolean.FALSE)
                .inviteCode(generateInviteCode())
                .maxMembers(request.maxMembers() != null ? request.maxMembers() : 20)
                .build();
        team.setCreatedBy(userSso);
        team.setUpdatedBy(userSso);

        Team saved = teamRepository.save(team);

        // Người tạo team tự động trở thành OWNER
        TeamMember owner = TeamMember.builder()
                .teamId(saved.getTeamId())
                .userSso(userSso)
                .role(TeamRole.OWNER)
                .joinedAt(Instant.now())
                .build();
        owner.setCreatedBy(userSso);
        owner.setUpdatedBy(userSso);
        teamMemberRepository.save(owner);

        return toTeamResponse(saved, 1);
    }

    // ── Lấy thông tin chi tiết Team ──

    @Transactional(readOnly = true)
    public TeamDetailResponse getTeamDetail(Long teamId, String userSso) {
        Team team = findActiveTeam(teamId);
        getActiveTeamMember(teamId, userSso); // đảm bảo user là thành viên

        List<TeamMember> members = teamMemberRepository.findByTeamId(teamId).stream()
                .filter(m -> m.getLeftAt() == null)
                .toList();

        List<TeamMemberResponse> memberResponses = members.stream()
                .map(this::toMemberResponse)
                .toList();

        return new TeamDetailResponse(toTeamResponse(team, members.size()), memberResponses);
    }

    // ── Lấy danh sách Teams mà user đang là thành viên ──

    @Transactional(readOnly = true)
    public List<TeamResponse> getMyTeams(String userSso) {
        List<TeamMember> memberships = teamMemberRepository.findByUserSso(userSso).stream()
                .filter(m -> m.getLeftAt() == null)
                .toList();

        return memberships.stream()
                .map(m -> {
                    Team team = teamRepository.findById(m.getTeamId()).orElse(null);
                    if (team == null || team.getDeletedAt() != null) {
                        return null;
                    }
                    List<TeamMember> activeMembers = teamMemberRepository.findByTeamId(team.getTeamId()).stream()
                            .filter(tm -> tm.getLeftAt() == null)
                            .toList();
                    return toTeamResponse(team, activeMembers.size(), toMemberPreviews(activeMembers));
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    // ── Cập nhật thông tin Team ──

    public TeamResponse updateTeam(Long teamId, String userSso, UpdateTeamRequest request) {
        Team team = findActiveTeam(teamId);
        TeamMember member = getActiveTeamMember(teamId, userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_EDIT, member.getRole());

        if (request.name() != null && !request.name().isBlank()) {
            team.setName(request.name().trim());
        }
        if (request.description() != null) {
            team.setDescription(request.description().trim());
        }
        if (request.avatarUrl() != null) {
            team.setAvatarUrl(request.avatarUrl());
        }
        if (request.isPrivate() != null) {
            team.setIsPrivate(request.isPrivate());
        }
        if (request.maxMembers() != null) {
            team.setMaxMembers(request.maxMembers());
        }
        team.setUpdatedBy(userSso);

        Team saved = teamRepository.save(team);
        int memberCount = countActiveMembers(teamId);
        return toTeamResponse(saved, memberCount);
    }

    // ── Xóa Team (Soft delete) ──

    public void deleteTeam(Long teamId, String userSso) {
        Team team = findActiveTeam(teamId);
        TeamMember member = getActiveTeamMember(teamId, userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_DELETE, member.getRole());

        team.setDeletedAt(Instant.now());
        team.setUpdatedBy(userSso);
        teamRepository.save(team);
    }

    // ── Tham gia nhóm qua mã mời (Invite Code) ──

    public TeamMemberResponse joinTeamByInviteCode(String userSso, JoinTeamByCodeRequest request) {
        if (request.inviteCode() == null || request.inviteCode().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_INVALID);
        }

        Team team = teamRepository.findByInviteCode(request.inviteCode().trim())
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND,
                        request.inviteCode()));

        if (team.getDeletedAt() != null) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_NOT_FOUND);
        }

        // Kiểm tra xem user đã là thành viên hay chưa
        if (Boolean.TRUE.equals(
                teamMemberRepository.existsByTeamIdAndUserSsoAndLeftAtIsNull(team.getTeamId(), userSso))) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_MEMBER_INVALID);
        }

        // Kiểm tra giới hạn thành viên
        int currentCount = countActiveMembers(team.getTeamId());
        if (team.getMaxMembers() != null && currentCount >= team.getMaxMembers()) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_INVALID);
        }

        TeamMember member = TeamMember.builder()
                .teamId(team.getTeamId())
                .userSso(userSso)
                .role(TeamRole.MEMBER)
                .joinedAt(Instant.now())
                .build();
        member.setCreatedBy(userSso);
        member.setUpdatedBy(userSso);

        TeamMember saved = teamMemberRepository.save(member);
        return toMemberResponse(saved);
    }

    // ── Thêm thành viên vào nhóm (bởi OWNER) ──

    public TeamMemberResponse addMember(Long teamId, String ownerSso, AddMemberRequest request) {
        findActiveTeam(teamId);
        TeamMember ownerMember = getActiveTeamMember(teamId, ownerSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_INVITE_MEMBER, ownerMember.getRole());

        if (request.userSso() == null || request.userSso().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_USER_SSO_REQUIRED);
        }

        // Kiểm tra trùng lặp
        if (Boolean.TRUE.equals(
                teamMemberRepository.existsByTeamIdAndUserSsoAndLeftAtIsNull(teamId, request.userSso().trim()))) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_MEMBER_INVALID);
        }

        TeamMember member = TeamMember.builder()
                .teamId(teamId)
                .userSso(request.userSso().trim())
                .role(TeamRole.MEMBER)
                .joinedAt(Instant.now())
                .build();
        member.setCreatedBy(ownerSso);
        member.setUpdatedBy(ownerSso);

        TeamMember saved = teamMemberRepository.save(member);
        return toMemberResponse(saved);
    }

    // ── Xóa (kick) thành viên khỏi nhóm ──

    public void removeMember(Long teamId, String ownerSso, String targetUserSso) {
        findActiveTeam(teamId);
        TeamMember ownerMember = getActiveTeamMember(teamId, ownerSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_REMOVE_MEMBER, ownerMember.getRole());

        if (ownerSso.equals(targetUserSso)) {
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_MEMBER_INVALID);
        }

        TeamMember target = getActiveTeamMember(teamId, targetUserSso);
        target.setLeftAt(Instant.now());
        target.setUpdatedBy(ownerSso);
        teamMemberRepository.save(target);
    }

    // ── OWNER rời nhóm (phải chuyển quyền trước) ──

    public void leaveTeam(Long teamId, String userSso) {
        findActiveTeam(teamId);
        TeamMember member = getActiveTeamMember(teamId, userSso);

        if (TeamRole.OWNER.equals(member.getRole())) {
            // OWNER không thể rời nhóm mà phải chuyển quyền trước hoặc xóa nhóm
            throw new BadRequestException(MessageConstants.MESSAGE_TEAM_MEMBER_INVALID);
        }

        member.setLeftAt(Instant.now());
        member.setUpdatedBy(userSso);
        teamMemberRepository.save(member);
    }

    // ── Lấy danh sách thành viên ──

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getMembers(Long teamId, String userSso) {
        findActiveTeam(teamId);
        getActiveTeamMember(teamId, userSso);

        return teamMemberRepository.findByTeamId(teamId).stream()
                .filter(m -> m.getLeftAt() == null)
                .map(this::toMemberResponse)
                .toList();
    }

    // ── Sinh lại Invite Code ──

    public TeamResponse regenerateInviteCode(Long teamId, String userSso) {
        Team team = findActiveTeam(teamId);
        TeamMember member = getActiveTeamMember(teamId, userSso);
        permissionCheckService.requireTeamRole(Permission.TEAM_EDIT, member.getRole());

        team.setInviteCode(generateInviteCode());
        team.setUpdatedBy(userSso);
        Team saved = teamRepository.save(team);
        return toTeamResponse(saved, countActiveMembers(teamId));
    }

    // ── Helper Methods ──

    private Team findActiveTeam(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND, teamId));
        if (team.getDeletedAt() != null) {
            throw new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_NOT_FOUND, teamId);
        }
        return team;
    }

    private TeamMember getActiveTeamMember(Long teamId, String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        return teamMemberRepository.findById(new TeamMemberId(teamId, userSso))
                .filter(m -> m.getLeftAt() == null)
                .orElseThrow(
                        () -> new ResourceNotFoundException(MessageConstants.MESSAGE_TEAM_MEMBER_NOT_FOUND, userSso));
    }

    private int countActiveMembers(Long teamId) {
        return (int) teamMemberRepository.findByTeamId(teamId).stream()
                .filter(m -> m.getLeftAt() == null)
                .count();
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private TeamResponse toTeamResponse(Team team, int memberCount) {
        return toTeamResponse(team, memberCount, List.of());
    }

    private TeamResponse toTeamResponse(Team team, int memberCount, List<MemberPreview> memberPreviews) {
        return new TeamResponse(
                team.getTeamId(),
                team.getName(),
                team.getDescription(),
                team.getAvatarUrl(),
                team.getIsPrivate(),
                team.getInviteCode(),
                team.getMaxMembers(),
                memberCount,
                team.getCreatedAt(),
                memberPreviews != null ? memberPreviews : List.of());
    }

    private List<MemberPreview> toMemberPreviews(List<TeamMember> members) {
        return members.stream()
                .limit(5)
                .map(member -> {
                    var userOpt = userRepository.findByUserSso(member.getUserSso());
                    String nickname = member.getNickname();
                    if (nickname == null || nickname.isBlank()) {
                        nickname = userOpt
                                .map(user -> {
                                    if (user.getFullName() != null && !user.getFullName().isBlank()) {
                                        return user.getFullName();
                                    }
                                    return user.getEmail();
                                })
                                .orElse(member.getUserSso());
                    }
                    String avatarUrl = userOpt.map(u -> u.getAvatarUrl()).orElse(null);
                    return new MemberPreview(member.getUserSso(), nickname, avatarUrl);
                })
                .toList();
    }

    private TeamMemberResponse toMemberResponse(TeamMember member) {
        var userOpt = userRepository.findByUserSso(member.getUserSso());
        String nickname = member.getNickname();
        if (nickname == null || nickname.isBlank()) {
            nickname = userOpt
                    .map(user -> {
                        if (user.getFullName() != null && !user.getFullName().isBlank()) {
                            return user.getFullName();
                        }
                        return user.getEmail();
                    })
                    .orElse(member.getUserSso());
        }
        String avatarUrl = userOpt.map(u -> u.getAvatarUrl()).orElse(null);
        return new TeamMemberResponse(
                member.getTeamId(),
                member.getUserSso(),
                member.getRole() != null ? member.getRole().name() : null,
                nickname,
                avatarUrl,
                member.getJoinedAt());
    }
}
