package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.workflow.enums.RoomType;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;

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
    }

    public void validateRoomAction(Long roomId, String userSso) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (userSso == null || userSso.isBlank()) {
            throw new ForbiddenException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public String validateTargetUserSso(RoomMemberActionRequest request) {
        if (request == null || request.targetUserSso() == null || request.targetUserSso().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return request.targetUserSso().trim();
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
}
