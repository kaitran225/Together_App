package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.workflow.manager.room.RoomDomainManagerRegistry;
import app.together.workflow.manager.room.SocialRoomManager;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
@RequiredArgsConstructor
public class RoomJoinPolicyService {

    private final RoomDomainManagerRegistry roomDomainManagerRegistry;
    private final RoomMemberRepository roomMemberRepository;
    private final SocialRoomManager socialRoomManager;

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
        if (room.getRoomType() == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }

        roomDomainManagerRegistry.getRequired(room.getRoomType());
        socialRoomManager.validateJoinPolicy(room);
    }
}
