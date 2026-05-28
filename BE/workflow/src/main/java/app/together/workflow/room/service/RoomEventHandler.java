package app.together.workflow.room.service;

import app.together.common.workflow.entity.RoomEventEntity;
import app.together.common.workflow.repository.RoomEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
@Transactional
public class RoomEventHandler {

    private final RoomEventRepository roomEventRepository;

    public RoomEventEntity record(Long roomId, String eventType, String actorSso, String payload) {
        return roomEventRepository.save(RoomEventEntity.builder()
                .roomId(roomId)
                .eventType(eventType)
                .actorSso(actorSso)
                .payload(payload)
                .eventAt(Instant.now())
                .build());
    }

    @Transactional(readOnly = true)
    public List<RoomEventEntity> findTimeline(Long roomId) {
        return roomEventRepository.findByRoomIdOrderByEventAtDesc(roomId);
    }
}
