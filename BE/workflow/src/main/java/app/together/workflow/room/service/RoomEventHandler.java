package app.together.workflow.room.service;

import app.together.common.workflow.entity.RoomEventEntity;
import app.together.common.workflow.repository.RoomEventRepository;
import app.together.workflow.room.dto.RoomDtos.RoomTimelineItem;
import app.together.workflow.room.dto.RoomDtos.RoomTimelineResponse;
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
    public RoomTimelineResponse findTimeline(Long roomId) {
        List<RoomTimelineItem> items = roomEventRepository.findByRoomIdOrderByEventAtDesc(roomId).stream()
                .map(event -> new RoomTimelineItem(
                        event.getRoomId(),
                        event.getEventType(),
                        event.getActorSso(),
                        event.getPayload(),
                        event.getEventAt()))
                .toList();
        return new RoomTimelineResponse(roomId, items);
    }
}
