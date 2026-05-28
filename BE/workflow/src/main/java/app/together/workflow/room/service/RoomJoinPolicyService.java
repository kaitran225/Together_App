package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.enums.RoomType;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class RoomJoinPolicyService {

    public void ensureRoomIsJoinable(Room room, JoinRoomRequest request) {
        if (room == null) {
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
}
