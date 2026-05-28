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
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
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

    public RoomResponse createRoom(String userSso, CreateRoomRequest request) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_CREATE);
        roomValidator.validateCreateRoomRequest(userSso, request);

        Instant now = Instant.now();
        boolean isPublic = Boolean.TRUE.equals(request.isPublic());
        Room room = roomRepository.save(roomStateService.buildRoom(request, isPublic, userSso, now));
        roomStateService.createOwnerMember(roomMemberRepository, room.getRoomId(), userSso, now);
        return toRoomResponse(room);
    }

    public RoomResponse joinRoom(Long roomId, String userSso, JoinRoomRequest request) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_JOIN);
        roomValidator.validateJoinRequest(roomId, userSso);

        Room room = roomGuardService.requireJoinableRoom(roomId);
        roomValidator.ensureRoomIsJoinable(room, request);
        roomGuardService.requireRoomHasCapacity(room);
        roomValidator.validateJoinPolicyByRoomType(room);

        Instant now = Instant.now();
        RoomMember member = roomMemberRepository.findById(new RoomMemberId(roomId, userSso))
                .map(existing -> roomStateService.reactivateMember(existing, now))
                .orElseGet(() -> roomStateService.buildNewMember(roomId, userSso, now));

        roomMemberRepository.save(member);
        roomStateService.syncRoomCapacityStatus(room);
        roomEventHandler.record(roomId, "ROOM_MEMBER_JOINED", userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse leaveRoom(Long roomId, String userSso) {
        permissionCheckService.requireSystemPermission(Permission.ROOM_CHAT);
        roomValidator.validateMemberAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        roomGuardService.requireRoomOpenOrFull(room);

        RoomMember member = roomGuardService.requireActiveMember(roomId, userSso);
        if (RoomRole.HOST.equals(member.getRole())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_CANNOT_LEAVE);
        }

        Instant now = Instant.now();
        roomStateService.deactivateMember(member, now);
        roomMemberRepository.save(member);
        roomStateService.syncRoomCapacityStatus(room);
        roomEventHandler.record(roomId, "ROOM_MEMBER_LEFT", userSso, member.getUserSso());
        return toRoomResponse(room);
    }

    public RoomResponse closeRoom(Long roomId, String userSso) {
        permissionCheckService.requireRoomRole(Permission.ROOM_DELETE, RoomRole.HOST);
        roomValidator.validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        Instant now = Instant.now();
        roomStateService.closeRoom(room, userSso, now);

        List<RoomMember> members = roomMemberRepository.findByRoomId(roomId);
        roomStateService.deactivateActiveMembers(members, now);
        roomMemberRepository.saveAll(members);
        roomEventHandler.record(roomId, "ROOM_CLOSED", userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse openRoom(Long roomId, String userSso) {
        permissionCheckService.requireRoomRole(Permission.ROOM_MODERATE, RoomRole.HOST);
        roomValidator.validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember host = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(host);

        roomValidator.validateRoomCanBeOpened(room);
        roomStateService.openRoom(room);
        roomEventHandler.record(roomId, "ROOM_OPENED", userSso, room.getStatus());
        return toRoomResponse(room);
    }

    public RoomResponse kickMember(Long roomId, String userSso, RoomMemberActionRequest request) {
        permissionCheckService.requireRoomRole(Permission.ROOM_KICK_MEMBER, RoomRole.HOST);
        roomValidator.validateOwnerAction(roomId, userSso);

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
        roomValidator.validateOwnerAction(roomId, userSso);

        Room room = roomGuardService.requireRoom(roomId);
        RoomMember currentHost = roomGuardService.requireHost(roomId, userSso);
        roomGuardService.requireHost(currentHost);

        String targetUserSso = roomValidator.validateTargetUserSso(request);
        roomGuardService.requireNotSelfAction(userSso, targetUserSso);

        if (roomMemberRepository.findById(new RoomMemberId(roomId, targetUserSso)).isEmpty()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_NOT_FOUND);
        }

        RoomMember targetMember = roomGuardService.requireTargetActiveMember(roomId, targetUserSso);
        roomStateService.transferOwner(currentHost, targetMember);
        roomMemberRepository.save(targetMember);
        roomMemberRepository.save(currentHost);

        roomEventHandler.record(roomId, "ROOM_OWNER_TRANSFERRED", userSso, targetUserSso);
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

    private Room getRoomEntity(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(ROOM_RESOURCE, roomId));
    }

    private RoomResponse toRoomResponse(Room room) {
        return roomResponseMapper.toRoomResponse(room, roomMemberRepository.findByRoomId(room.getRoomId()));
    }
}
