package app.together.workflow.room.service;

import app.together.common.auth.enums.RoomRole;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.entity.RoomMemberId;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.enums.RoomType;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomEvent;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberResponse;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private static final int INVITE_CODE_LENGTH = 8;
    private static final int EVENT_VERSION = 1;
    private static final String ROOM_RESOURCE = "Room";

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PermissionCheckService permissionCheckService;
    private final RoomGuardService roomGuardService;
    private final RoomEventService eventService;

    public RoomResponse createRoom(String userSso, CreateRoomRequest request) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_CREATE);
        validateCreateRoomRequest(userSso, request);

        Instant now = Instant.now();
        boolean isPublic = Boolean.TRUE.equals(request.isPublic());
        Room room = roomRepository.save(buildRoom(request, isPublic, userSso, now));
        createOwnerMember(room.getRoomId(), userSso, now);
        return toRoomResponse(room);
    }

    public RoomResponse joinRoom(Long roomId, String userSso, JoinRoomRequest request) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_JOIN);
        validateJoinRequest(roomId, userSso);

        Room room = roomGuardService.requireJoinableRoom(roomId);
        ensureRoomIsJoinable(room, request);
        roomGuardService.requireRoomHasCapacity(room);
        validateJoinPolicyByRoomType(room);

        Instant now = Instant.now();
        RoomMember member = roomMemberRepository.findById(new RoomMemberId(roomId, userSso))
                .map(existing -> reactivateMember(existing, now))
                .orElseGet(() -> buildNewMember(roomId, userSso, now));

        roomMemberRepository.save(member);
        syncRoomCapacityStatus(room);
        eventService.record(roomId, "ROOM_MEMBER_JOINED", userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse leaveRoom(Long roomId, String userSso) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_CHAT);
        validateMemberAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        roomGuardService.requireRoomOpenOrFull(room);

        RoomMember member = roomGuardService.requireActiveMember(roomId, userSso);
        if (RoomRole.HOST.equals(member.getRole())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_CANNOT_LEAVE);
        }

        Instant now = Instant.now();
        member.setIsActive(false);
        member.setLeftAt(now);
        member.setLastActiveAt(now);
        roomMemberRepository.save(member);
        syncRoomCapacityStatus(room);
        eventService.record(roomId, "ROOM_MEMBER_LEFT", userSso, member.getUserSso());
        return toRoomResponse(room);
    }

    public RoomResponse closeRoom(Long roomId, String userSso) {
        permissionCheckService.requireRoomRole(Permission.ROOM_DELETE, RoomRole.HOST);
        validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        Instant now = Instant.now();
        room.setStatus(RoomStatus.CLOSED.name());
        room.setClosedAt(now);
        room.setClosedBy(userSso);
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
        eventService.record(roomId, "ROOM_CLOSED", userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse openRoom(Long roomId, String userSso) {
        permissionCheckService.requireRoomRole(Permission.ROOM_MODERATE, RoomRole.HOST);
        validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        if (!RoomStatus.CLOSED.name().equals(room.getStatus()) && !RoomStatus.DRAFT.name().equals(room.getStatus())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        room.setStatus(RoomStatus.OPEN.name());
        room.setClosedAt(null);
        room.setClosedBy(null);
        roomRepository.save(room);
        eventService.record(roomId, "ROOM_OPENED", userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse kickMember(Long roomId, String userSso, RoomMemberActionRequest request) {
        permissionCheckService.requireRoomRole(Permission.ROOM_KICK_MEMBER, RoomRole.HOST);
        validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        String targetUserSso = validateTargetUserSso(request);
        roomGuardService.requireNotSelfAction(userSso, targetUserSso);

        RoomMember targetMember = roomGuardService.requireTargetActiveMember(roomId, targetUserSso);
        if (RoomRole.HOST.equals(targetMember.getRole())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        Instant now = Instant.now();
        targetMember.setIsActive(false);
        targetMember.setLeftAt(now);
        targetMember.setLastActiveAt(now);
        roomMemberRepository.save(targetMember);
        syncRoomCapacityStatus(room);
        return toRoomResponse(room);
    }

    public RoomResponse transferOwner(Long roomId, String userSso, RoomMemberActionRequest request) {
        permissionCheckService.requireRoomRole(Permission.ROOM_MODERATE, RoomRole.HOST);
        validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember currentHost = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(currentHost);

        String targetUserSso = validateTargetUserSso(request);
        roomGuardService.requireNotSelfAction(userSso, targetUserSso);

        if (roomMemberRepository.findById(new RoomMemberId(roomId, targetUserSso)).isEmpty()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_NOT_FOUND);
        }

        RoomMember targetMember = roomGuardService.requireTargetActiveMember(roomId, targetUserSso);
        targetMember.setRole(RoomRole.HOST);
        roomMemberRepository.save(targetMember);

        currentHost.setRole(RoomRole.PARTICIPANT);
        roomMemberRepository.save(currentHost);

        eventService.record(roomId, "ROOM_OWNER_TRANSFERRED", userSso, targetUserSso);
        return toRoomResponse(room);
    }

    public RoomResponse promoteHost(Long roomId, String userSso, RoomMemberActionRequest request) {
        return transferOwner(roomId, userSso, request);
    }

    public RoomResponse getRoom(Long roomId) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return toRoomResponse(getRoomEntity(roomId));
    }

    public RoomEvent buildEvent(Long roomId, String type, String actor, Object payload) {
        return new RoomEvent(
                UUID.randomUUID().toString(),
                UUID.randomUUID().toString(),
                EVENT_VERSION,
                String.valueOf(roomId),
                type,
                actor,
                Instant.now(),
                payload);
    }

    private void validateCreateRoomRequest(String userSso, CreateRoomRequest request) {
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (request == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (request.title() == null || request.title().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (request.goalDurationDays() != null && request.goalDurationDays() < 1) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        RoomType roomType = resolveRoomType(request);
        validateMaxMembersForRoomType(request.maxMembers(), roomType);
    }

    private int resolveDefaultMaxMembers(CreateRoomRequest request) {
        RoomType roomType = resolveRoomType(request);
        int defaultMaxMembers = RoomType.TEAM.equals(roomType) ? 6 : 10;
        if (request.maxMembers() == null || request.maxMembers() <= 0) {
            return defaultMaxMembers;
        }
        validateMaxMembersForRoomType(request.maxMembers(), roomType);
        return request.maxMembers();
    }

    private RoomType resolveRoomType(CreateRoomRequest request) {
        if (request == null || request.roomType() == null || request.roomType().isBlank()) {
            return RoomType.SOCIAL;
        }

        try {
            return RoomType.valueOf(request.roomType().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    private void validateMaxMembersForRoomType(Integer maxMembers, RoomType roomType) {
        if (maxMembers == null || maxMembers <= 0) {
            return;
        }

        int defaultMaxMembers = RoomType.TEAM.equals(roomType) ? 6 : 10;
        if (RoomType.SOCIAL.equals(roomType) && maxMembers < defaultMaxMembers) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (RoomType.TEAM.equals(roomType) && maxMembers < defaultMaxMembers) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    private void validateJoinRequest(Long roomId, String userSso) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    private void validateMemberAction(Long roomId, String userSso) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    private void validateOwnerAction(Long roomId, String userSso) {
        validateMemberAction(roomId, userSso);
    }

    private String validateTargetUserSso(RoomMemberActionRequest request) {
        if (request == null || request.targetUserSso() == null || request.targetUserSso().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return request.targetUserSso().trim();
    }

    private Room buildRoom(CreateRoomRequest request, boolean isPublic, String userSso, Instant now) {
        RoomType roomType = resolveRoomType(request);
        int baseMembers = resolveDefaultMaxMembers(request);
        boolean enableAudio = RoomType.TEAM.equals(roomType);
        boolean enableVideo = true;
        boolean enableChat = true;

        Room room = Room.builder()
                .title(trimToNull(request.title()))
                .description(trimToNull(request.description()))
                .goalDescription(trimToNull(request.goalDescription()))
                .goalDurationDays(request.goalDurationDays())
                .maxMembers(baseMembers)
                .roomType(roomType)
                .baseMembers(baseMembers)
                .extraMembersPurchased(0)
                .enableAudio(enableAudio)
                .enableVideo(enableVideo)
                .enableChat(enableChat)
                .isPremium(Boolean.TRUE.equals(request.isPremium()))
                .isPublic(isPublic)
                .inviteCode(isPublic ? null : generateInviteCode())
                .status(RoomStatus.OPEN.name())
                .activatedAt(now)
                .build();
        room.setCreatedBy(userSso);
        room.setUpdatedBy(userSso);
        return room;
    }

    private Room getRoomEntity(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(ROOM_RESOURCE, roomId));
    }

    private void ensureRoomIsJoinable(Room room, JoinRoomRequest request) {
        if (!RoomStatus.OPEN.name().equals(room.getStatus())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        if (room.getDeletedAt() != null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        if (room.getInviteCode() != null) {
            if (request == null || request.inviteCode() == null || request.inviteCode().isBlank()) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
            if (!Objects.equals(room.getInviteCode(), request.inviteCode().trim())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
        }
    }

    private void validateJoinPolicyByRoomType(Room room) {
        if (room == null || room.getRoomType() == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        if (RoomType.SOCIAL.equals(room.getRoomType())) {
            if (Boolean.TRUE.equals(room.getEnableAudio())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
            if (!Boolean.TRUE.equals(room.getEnableVideo())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
            if (!Boolean.TRUE.equals(room.getEnableChat())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
            return;
        }

        if (RoomType.TEAM.equals(room.getRoomType())) {
            if (!Boolean.TRUE.equals(room.getEnableAudio())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
            if (!Boolean.TRUE.equals(room.getEnableVideo())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
            if (!Boolean.TRUE.equals(room.getEnableChat())) {
                throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
        }
    }

    private void syncRoomCapacityStatus(Room room) {
        if (room.getMaxMembers() == null) {
            return;
        }

        long activeMembers = roomMemberRepository.countByRoomIdAndIsActiveTrue(room.getRoomId());
        String nextStatus = activeMembers >= room.getMaxMembers() ? RoomStatus.FULL.name() : RoomStatus.OPEN.name();
        if (!Objects.equals(room.getStatus(), nextStatus)) {
            room.setStatus(nextStatus);
            roomRepository.save(room);
        }
    }

    private void createOwnerMember(Long roomId, String userSso, Instant now) {
        roomMemberRepository.save(RoomMember.builder()
                .roomId(roomId)
                .userSso(userSso)
                .role(RoomRole.HOST)
                .isActive(true)
                .joinedAt(now)
                .lastActiveAt(now)
                .build());
    }

    private RoomMember reactivateMember(RoomMember member, Instant now) {
        member.setIsActive(true);
        member.setLastActiveAt(now);
        member.setLeftAt(null);
        if (member.getJoinedAt() == null) {
            member.setJoinedAt(now);
        }
        if (member.getRole() == null) {
            member.setRole(RoomRole.PARTICIPANT);
        }
        return member;
    }

    private RoomMember buildNewMember(Long roomId, String userSso, Instant now) {
        return RoomMember.builder()
                .roomId(roomId)
                .userSso(userSso)
                .role(RoomRole.PARTICIPANT)
                .isActive(true)
                .joinedAt(now)
                .lastActiveAt(now)
                .build();
    }

    private RoomResponse toRoomResponse(Room room) {
        List<RoomMemberResponse> members = roomMemberRepository.findByRoomId(room.getRoomId()).stream()
                .map(member -> new RoomMemberResponse(
                        member.getRoomId(),
                        member.getUserSso(),
                        member.getRole(),
                        member.getIsActive(),
                        member.getJoinedAt(),
                        member.getLeftAt(),
                        member.getLastActiveAt()))
                .toList();

        return new RoomResponse(
                room.getRoomId(),
                room.getTitle(),
                room.getDescription(),
                room.getInviteCode(),
                room.getStatus(),
                room.getIsPublic(),
                room.getIsPremium(),
                room.getMaxMembers(),
                room.getRoomType() == null ? null : room.getRoomType().name(),
                room.getEnableAudio(),
                room.getEnableVideo(),
                room.getEnableChat(),
                room.getBaseMembers(),
                room.getExtraMembersPurchased(),
                room.getActivatedAt(),
                room.getExpiresAt(),
                room.getClosedAt(),
                members);
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, INVITE_CODE_LENGTH).toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
