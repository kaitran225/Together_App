package app.together.workflow.manager.room;

import app.together.common.workflow.enums.RoomType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoomDomainManagerRegistry {

    private final List<RoomDomainManager> roomDomainManagers;

    public RoomDomainManager getRequired(RoomType roomType) {
        return roomDomainManagers.stream()
                .filter(manager -> manager.supports(roomType))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported room type: " + roomType));
    }
}
