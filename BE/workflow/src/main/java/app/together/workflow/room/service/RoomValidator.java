package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.enums.RoomType;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class RoomValidator {

    public void validateCreateRoomRequest(String userSso, CreateRoomRequest request) {
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

    public void validateJoinRequest(Long roomId, String userSso) {
        validateRoomId(roomId);
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void validateMemberAction(Long roomId, String userSso) {
        validateRoomId(roomId);
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void validateOwnerAction(Long roomId, String userSso) {
        validateMemberAction(roomId, userSso);
    }

    public String validateTargetUserSso(RoomMemberActionRequest request) {
        if (request == null || request.targetUserSso() == null || request.targetUserSso().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return request.targetUserSso().trim();
    }

    public void ensureRoomIsJoinable(Room room, JoinRoomRequest request) {
        if (room == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
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

    public void validateJoinPolicyByRoomType(Room room) {
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

    public void validateRoomCanBeOpened(Room room) {
        if (room == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (!RoomStatus.CLOSED.name().equals(room.getStatus()) && !RoomStatus.DRAFT.name().equals(room.getStatus())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public RoomType resolveRoomType(CreateRoomRequest request) {
        if (request == null || request.roomType() == null || request.roomType().isBlank()) {
            return RoomType.SOCIAL;
        }

        try {
            return RoomType.valueOf(request.roomType().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void validateMaxMembersForRoomType(Integer maxMembers, RoomType roomType) {
        if (maxMembers == null || maxMembers <= 0) {
            return;
        }

        int defaultMaxMembers = RoomType.TEAM.equals(roomType) ? 6 : 10;
        if (maxMembers < defaultMaxMembers) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    private void validateRoomId(Long roomId) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }
}
