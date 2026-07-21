package app.together.workflow.room.service;

import app.together.common.auth.enums.RoomRole;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ConflictException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.exception.UnauthorizedException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.entity.RoomMemberId;
import app.together.common.workflow.enums.RoomRequestStatus;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RoomGuardService {

    private static final String ROOM_RESOURCE = "Room";

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    public Room requireRoom(Long roomId) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(ROOM_RESOURCE, roomId));
    }

    public Room requireJoinableRoom(Long roomId) {
        Room room = requireRoom(roomId);
        if (room.getDeletedAt() != null) {
            throw new ConflictException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (!RoomStatus.OPEN.name().equals(room.getStatus())) {
            throw new ConflictException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return room;
    }

    public Room requireOwnerActionRoom(Long roomId, String userSso) {
        requireAuthenticatedUser(userSso);
        Room room = requireRoom(roomId);
        RoomMember member = requireActiveMember(roomId, userSso);
        requireHost(member);
        return room;
    }

    public Room requireMemberActionRoom(Long roomId, String userSso) {
        requireAuthenticatedUser(userSso);
        return requireRoom(roomId);
    }

    public RoomMember requireActiveMember(Long roomId, String userSso) {
        requireAuthenticatedUser(userSso);
        return roomMemberRepository.findById(new RoomMemberId(roomId, userSso))
                .filter(RoomMember::getIsActive)
                .orElseThrow(() -> new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED));
    }

    public RoomMember requireMember(Long roomId, String userSso) {
        requireAuthenticatedUser(userSso);
        return roomMemberRepository.findById(new RoomMemberId(roomId, userSso))
                .orElseThrow(() -> new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED));
    }

    public RoomMember requireHost(Long roomId, String userSso) {
        RoomMember member = requireActiveMember(roomId, userSso);
        requireHost(member);
        return member;
    }

    public RoomMember requireTargetActiveMember(Long roomId, String targetUserSso) {
        if (targetUserSso == null || targetUserSso.isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return roomMemberRepository.findById(new RoomMemberId(roomId, targetUserSso.trim()))
                .filter(RoomMember::getIsActive)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_NOT_FOUND));
    }

    public void requireNotSelfAction(String actorUserSso, String targetUserSso) {
        if (actorUserSso != null && targetUserSso != null && actorUserSso.trim().equals(targetUserSso.trim())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_MEMBER_CANNOT_KICK_SELF);
        }
    }

    public void requireRoomJoinable(Long roomId) {
        Room room = requireJoinableRoom(roomId);
        if (room.getMaxMembers() != null) {
            long activeMembers = roomMemberRepository.countByRoomIdAndIsActiveTrue(roomId);
            if (activeMembers >= room.getMaxMembers()) {
                throw new ConflictException(MessageConstants.MESSAGE_ROOM_INVALID);
            }
        }
    }

    public void requireRoomHasCapacity(Room room) {
        if (room.getMaxMembers() == null) {
            return;
        }
        long activeMembers = roomMemberRepository.countByRoomIdAndIsActiveTrue(room.getRoomId());
        if (activeMembers >= room.getMaxMembers()) {
            throw new ConflictException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void requireRoomOpenOrFull(Room room) {
        if (room == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (!Objects.equals(room.getStatus(), RoomStatus.OPEN.name()) && !Objects.equals(room.getStatus(), RoomStatus.FULL.name())) {
            throw new ConflictException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void requireRoomClosedOrDraft(Room room) {
        if (room == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (!Objects.equals(room.getStatus(), RoomRequestStatus.EXPIRED.name()) && !Objects.equals(room.getStatus(), RoomStatus.DRAFT.name())) {
            throw new ConflictException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void requireAuthenticatedUser(String userSso) {
        if (userSso == null || userSso.isBlank()) {
            throw new UnauthorizedException(MessageConstants.MESSAGE_NOT_AUTHENTICATED);
        }
    }

    public void requireHost(RoomMember member) {
        if (member == null) {
            throw new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
        if (!RoomRole.HOST.equals(member.getRole())) {
            throw new ForbiddenException(MessageConstants.MESSAGE_PERMISSION_DENIED);
        }
    }
}
