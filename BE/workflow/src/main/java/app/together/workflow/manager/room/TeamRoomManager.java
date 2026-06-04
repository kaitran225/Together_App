package app.together.workflow.manager.room;

import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.enums.RoomType;
import app.together.common.workflow.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TeamRoomManager implements RoomDomainManager {

    @Override
    public RoomType supportedType() {
        return RoomType.TEAM;
    }

    @Override
    public void validateJoinPolicy(Room room){

    }
}
