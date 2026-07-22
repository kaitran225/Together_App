package app.together.workflow.room.service;

import app.together.common.auth.enums.RoomRole;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.security.Permission;
import app.together.common.shared.security.PermissionCheckService;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.entity.RoomMemberId;
import app.together.common.workflow.entity.UserMasterData;
import app.together.common.workflow.repository.RoomActivityRepository;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import app.together.common.workflow.repository.UserMasterDataRepository;
import app.together.common.workflow.enums.RoomRequestStatus;
import app.together.common.workflow.enums.RoomStatus;
import app.together.workflow.manager.room.RoomDomainManager;
import app.together.workflow.manager.room.RoomDomainManagerRegistry;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RoomService {

    private static final String ROOM_RESOURCE = "Room";

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final PermissionCheckService permissionCheckService;
    private final RoomGuardService roomGuardService;
    private final RoomValidator roomValidator;
    private final RoomStateService roomStateService;
    private final RoomResponseMapper roomResponseMapper;
    private final RoomEventHandler roomEventHandler;
    private final RoomJoinPolicyService roomJoinPolicyService;
    private final RoomDomainManagerRegistry roomDomainManagerRegistry;
    private final RoomActivityRepository roomActivityRepository;
    private final UserMasterDataRepository userMasterDataRepository;
    private final ApplicationEventPublisher eventPublisher;

    public RoomResponse createRoom(String userSso, CreateRoomRequest request) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_CREATE);
        roomValidator.validateCreateRoomRequest(userSso, request);

        roomValidator.validateAndReserveSlot(userSso);

        Instant now = Instant.now();
        boolean isPublic = Boolean.TRUE.equals(request.isPublic());
        Room room = roomRepository.save(roomStateService.buildRoom(request, isPublic, userSso, now));
        roomDomainManager(room).createOwnerMember(roomMemberRepository, room.getRoomId(), userSso, now);
        return toRoomResponse(room);
    }

    public RoomResponse joinRoom(Long roomId, String userSso, JoinRoomRequest request) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_JOIN);
        roomValidator.validateRoomAction(roomId, userSso);

        Room room = roomGuardService.requireJoinableRoom(roomId);
        roomJoinPolicyService.ensureRoomIsJoinable(room, request);
        roomGuardService.requireRoomHasCapacity(room);

        Instant now = Instant.now();
        RoomMember member = roomMemberRepository.findById(new RoomMemberId(roomId, userSso))
                .map(existing -> roomStateService.reactivateMember(existing, now))
                .orElseGet(() -> roomStateService.buildNewMember(roomId, userSso, now));

        // Kiểm tra xem phòng có host active nào khác không
        boolean hasActiveHost = roomMemberRepository.findByRoomId(roomId).stream()
                .anyMatch(m -> Boolean.TRUE.equals(m.getIsActive()) && RoomRole.HOST.equals(m.getRole()) && !m.getUserSso().equals(userSso));

        if (!hasActiveHost) {
            member.setRole(RoomRole.HOST);
            room.setExpiresAt(null);
            roomRepository.save(room);
        }

        roomMemberRepository.save(member);
        roomStateService.syncRoomCapacityStatus(room);
        roomEventHandler.record(roomId, MessageConstants.MESSAGE_ROOM_MEMBER_JOINED, userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse leaveRoom(Long roomId, String userSso) {
        // ROOM_JOIN is a system-level permission (any logged-in user).
        // Do NOT use ROOM_CHAT here — it requires a room role and fails when checked as system-only.
        permissionCheckService.requireSystemPermission(Permission.ROOM_JOIN);
        roomValidator.validateRoomAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);

        // Idempotent leave: already closed / already inactive → just return current state
        if (!RoomStatus.OPEN.name().equals(room.getStatus()) && !RoomStatus.FULL.name().equals(room.getStatus())) {
            return toRoomResponse(room);
        }

        RoomMember member = roomMemberRepository.findById(new RoomMemberId(roomId, userSso))
                .orElse(null);
        if (member == null || !Boolean.TRUE.equals(member.getIsActive())) {
            // Still close empty social rooms in case this was a stale reconnect leave
            long activeLeft = roomMemberRepository.countByRoomIdAndIsActiveTrue(roomId);
            if (activeLeft == 0 && app.together.common.workflow.enums.RoomType.SOCIAL.equals(room.getRoomType())) {
                Instant now = Instant.now();
                roomStateService.closeRoom(room, "SYSTEM", now);
                roomValidator.releaseSlot(room.getCreatedBy() != null ? room.getCreatedBy() : userSso);
            }
            return toRoomResponse(room);
        }

        Instant now = Instant.now();
        long durationMinutes = 0;
        if (member.getJoinedAt() != null) {
            durationMinutes = java.time.Duration.between(member.getJoinedAt(), now).toMinutes();
        }

        roomStateService.deactivateMember(member, now);
        roomMemberRepository.save(member);
        roomStateService.syncRoomCapacityStatus(room);

        List<RoomMember> otherActiveMembers = roomMemberRepository.findByRoomId(roomId).stream()
                .filter(m -> Boolean.TRUE.equals(m.getIsActive()) && !m.getUserSso().equals(userSso))
                .collect(java.util.stream.Collectors.toList());

        // Nếu user rời đi là host và còn người khác → chuyển host
        if (RoomRole.HOST.equals(member.getRole()) && !otherActiveMembers.isEmpty()) {
            RoomMember newHost = otherActiveMembers.stream()
                    .min(java.util.Comparator.comparing(RoomMember::getJoinedAt,
                            java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())))
                    .orElse(otherActiveMembers.get(0));

            member.setRole(RoomRole.PARTICIPANT);
            newHost.setRole(RoomRole.HOST);
            roomMemberRepository.save(newHost);
            roomMemberRepository.save(member);

            room.setExpiresAt(null);
            roomRepository.save(room);

            roomEventHandler.record(roomId, MessageConstants.MESSAGE_ROOM_HOST_TRANSFERRED, userSso, newHost.getUserSso());
        } else if (otherActiveMembers.isEmpty()
                && app.together.common.workflow.enums.RoomType.SOCIAL.equals(room.getRoomType())) {
            // Không còn ai trong phòng → đóng ngay (không chờ expiresAt)
            roomStateService.closeRoom(room, "SYSTEM", now);
            roomValidator.releaseSlot(room.getCreatedBy() != null ? room.getCreatedBy() : userSso);
            log.info("Social room {} closed immediately after last member left", roomId);
        }

        roomEventHandler.record(roomId, MessageConstants.MESSAGE_ROOM_MEMBER_LEFT, userSso, member.getUserSso());
        // Nếu thời gian học trên 0 phút, lưu hoạt động học tập và kích hoạt Event Gamification
        if (durationMinutes > 0) {
            Long masterDataId = userMasterDataRepository.findByUserSso(userSso)
                    .map(UserMasterData::getMasterDataId)
                    .orElseGet(() -> userMasterDataRepository.save(UserMasterData.builder().userSso(userSso).build()).getMasterDataId());

            if (masterDataId != null) {
                roomActivityRepository.save(app.together.common.workflow.entity.RoomActivity.builder()
                        .roomId(roomId)
                        .userMasterDataId(masterDataId)
                        .activityType(app.together.common.workflow.enums.RoomActivity.STUDY.toString())
                        .durationMinutes((int) durationMinutes)
                        .build());
            } else {
                log.warn("UserMasterData not found for userSso {}, skipping RoomActivity record.", userSso);
            }

            // Bắn sự kiện bất đồng bộ nội bộ để service Gamification/Auth bắt được để cộng
            // Exp/Streak
            eventPublisher.publishEvent(new app.together.workflow.room.event.StudySessionCompletedEvent(userSso,
                    (int) durationMinutes, now));
        }
        return toRoomResponse(room);
    }

    public RoomResponse closeRoom(Long roomId, String userSso) {
        permissionCheckService.requireRoomRole(Permission.ROOM_DELETE, RoomRole.HOST);
        roomValidator.validateRoomAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        Instant now = Instant.now();
        roomStateService.closeRoom(room, userSso, now);

        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        roomDomainManager(room).deactivateActiveMembers(members, now);
        roomMemberRepository.saveAll(members);
        roomEventHandler.record(roomId, MessageConstants.MESSAGE_ROOM_CLOSED, userSso, room.getStatus());

        roomValidator.releaseSlot(userSso); // thu hồi slot tạo phòng cho user
        return toRoomResponse(room);
    }

    public RoomResponse openRoom(Long roomId, String userSso) {
        permissionCheckService.requireRoomRole(Permission.ROOM_MODERATE, RoomRole.HOST);
        roomValidator.validateRoomAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        roomGuardService.requireRoomClosedOrDraft(room);
        roomStateService.openRoom(room);
        roomEventHandler.record(roomId, MessageConstants.MESSAGE_ROOM_OPENED, userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse kickMember(Long roomId, String userSso, RoomMemberActionRequest request) {
        permissionCheckService.requireRoomRole(Permission.ROOM_KICK_MEMBER, RoomRole.HOST);
        roomValidator.validateRoomAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        String targetUserSso = roomValidator.validateTargetUserSso(request);
        roomGuardService.requireNotSelfAction(userSso, targetUserSso);

        RoomMember targetMember = roomGuardService.requireTargetActiveMember(roomId, targetUserSso);
        if (RoomRole.HOST.equals(targetMember.getRole())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        Instant now = Instant.now();
        roomStateService.deactivateMember(targetMember, now);
        roomMemberRepository.save(targetMember);
        roomStateService.syncRoomCapacityStatus(room);
        return toRoomResponse(room);
    }

    public RoomResponse transferOwner(Long roomId, String userSso, RoomMemberActionRequest request) {
        permissionCheckService.requireRoomRole(Permission.ROOM_MODERATE, RoomRole.HOST);
        roomValidator.validateRoomAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember currentHost = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(currentHost);

        String targetUserSso = roomValidator.validateTargetUserSso(request);
        roomGuardService.requireNotSelfAction(userSso, targetUserSso);

        if (roomMemberRepository.findById(new RoomMemberId(roomId, targetUserSso)).isEmpty()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_NOT_FOUND);
        }

        RoomMember targetMember = roomGuardService.requireTargetActiveMember(roomId, targetUserSso);
        roomDomainManager(room).transferOwner(currentHost, targetMember);
        roomMemberRepository.save(targetMember);
        roomMemberRepository.save(currentHost);

        roomEventHandler.record(roomId, MessageConstants.MESSAGE_ROOM_HOST_TRANSFERRED, userSso, targetUserSso);
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

    @Transactional(readOnly = true)
    public List<RoomResponse> listActivePublicRooms() {
        return roomRepository.findAll().stream()
                .filter(this::isVisibleActiveRoom)
                .filter(room -> Boolean.TRUE.equals(room.getIsPublic()))
                .sorted(Comparator.comparing(Room::getActivatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> listMyRooms(String userSso) {
        List<Long> roomIds = roomMemberRepository.findByUserSso(userSso).stream()
                .map(RoomMember::getRoomId)
                .distinct()
                .toList();
        return roomRepository.findAllById(roomIds).stream()
                .filter(this::isVisibleActiveRoom)
                .sorted(Comparator.comparing(Room::getActivatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toRoomResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> listSuggestedRooms() {
        return roomRepository.findAll().stream()
                .filter(this::isVisibleActiveRoom)
                .filter(room -> Boolean.TRUE.equals(room.getIsPublic()))
                .sorted(Comparator.comparingLong((Room room) ->
                        roomMemberRepository.countByRoomIdAndIsActiveTrue(room.getRoomId())).reversed())
                .limit(5)
                .map(this::toRoomResponse)
                .toList();
    }

    private boolean isVisibleActiveRoom(Room room) {
        if (room.getDeletedAt() != null) {
            return false;
        }
        String status = room.getStatus();
        if (status == null) {
            return false;
        }
        if (RoomRequestStatus.EXPIRED.name().equalsIgnoreCase(status)) {
            return false;
        }
        // Treat OPEN/FULL as browseable; keep DRAFT out of discovery
        return RoomStatus.OPEN.name().equalsIgnoreCase(status)
                || RoomStatus.FULL.name().equalsIgnoreCase(status);
    }

    private Room getRoomEntity(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(ROOM_RESOURCE, roomId));
    }

    private RoomResponse toRoomResponse(Room room) {
        return roomResponseMapper.toRoomResponse(room, roomMemberRepository.findByRoomId(room.getRoomId()));
    }

    private RoomDomainManager roomDomainManager(Room room) {
        return roomDomainManagerRegistry.getRequired(room.getRoomType());
    }
}
