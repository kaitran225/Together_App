package app.together.workflow.manager.room;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Room;
import app.together.workflow.room.config.RoomMediaProperties;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class SocialRoomManager implements RoomDomainManager {

    private final RoomMediaProperties roomMediaProperties;

    public SocialRoomManager(RoomMediaProperties roomMediaProperties) {
        this.roomMediaProperties = roomMediaProperties;
    }

    @Override
    public app.together.common.workflow.enums.RoomType supportedType() {
        return app.together.common.workflow.enums.RoomType.SOCIAL;
    }

    @Override
    public void validateJoinPolicy(Room room) {
        if (room == null || room.getRoomType() == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        RoomMediaProperties.Profile profile = roomMediaProperties.profileFor(room.getRoomType());
        if (Boolean.TRUE.equals(profile.micEnabled())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        if (!Boolean.TRUE.equals(profile.videoEnabled()) || !Boolean.TRUE.equals(profile.chatEnabled())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }

    public void ensureRoomIsSocial(Room room) {
        if (room == null || !Objects.equals(room.getRoomType(), supportedType())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
    }
}
