package app.together.workflow.manager.room;

import app.together.common.workflow.enums.RoomType;
import org.springframework.stereotype.Service;

@Service
public class TeamRoomManager implements RoomDomainManager {

    @Override
    public RoomType supportedType() {
        return RoomType.TEAM;
    }
}
