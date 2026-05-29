package app.together.workflow.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.room.dto.RoomDtos.RoomEvent;
import app.together.workflow.room.dto.RoomDtos.SignalMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomRealtimeService {

    private static final String ROOM_SIGNAL_TOPIC_PREFIX = "/topic/rooms/";
    private static final String ROOM_SIGNAL_USER_QUEUE = "/queue/room-signals";
    private static final String SIGNAL_TYPE_PREFIX = "SIGNAL_";
    private static final int EVENT_VERSION = 1;

    private final SimpMessagingTemplate messagingTemplate;

    public void signal(SignalMessage message) {
        validateSignalMessage(message);

        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        Long roomId = parseRoomId(message.roomId());
        RoomEvent event = createEvent(
                roomId,
                SIGNAL_TYPE_PREFIX + message.type().trim().toUpperCase(),
                currentUserSso,
                message.payload());

        if (StringUtils.hasText(message.toUser())) {
            messagingTemplate.convertAndSendToUser(message.toUser().trim(), ROOM_SIGNAL_USER_QUEUE, event);
            return;
        }
        messagingTemplate.convertAndSend(ROOM_SIGNAL_TOPIC_PREFIX + roomId + "/signals", event);
    }

    private void validateSignalMessage(SignalMessage message) {
        if (message == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_SIGNAL_MESSAGE_REQUIRED);
        }
        if (!StringUtils.hasText(message.roomId())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_SIGNAL_ROOM_ID_REQUIRED);
        }
        if (!StringUtils.hasText(message.type())) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_SIGNAL_TYPE_REQUIRED);
        }
    }

    private RoomEvent createEvent(Long roomId, String type, String actor, Object payload) {
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

    private Long parseRoomId(String roomId) {
        try {
            return Long.valueOf(roomId.trim());
        } catch (NumberFormatException ex) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_SIGNAL_ROOM_ID_INVALID);
        }
    }
}
