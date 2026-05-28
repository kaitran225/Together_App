package app.together.workflow.room.service;

import app.together.workflow.room.dto.RoomDtos.RoomEvent;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

@Component
public class RoomEventFactory {

    private static final int EVENT_VERSION = 1;

    public RoomEvent create(Long roomId, String type, String actor, Object payload) {
        return new RoomEvent(
                UUID.randomUUID().toString(),
                UUID.randomUUID().toString(),
                EVENT_VERSION,
                String.valueOf(roomId),
                type,
                actor,
                Instant.now(),
                payload);
    }
}
