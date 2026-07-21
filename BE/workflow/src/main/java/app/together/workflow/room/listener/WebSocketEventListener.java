package app.together.workflow.room.listener;

import app.together.workflow.room.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final RoomService roomService;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = event.getUser();
        if (principal == null) return;

        String userSso = principal.getName();
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        if (sessionAttributes != null && sessionAttributes.containsKey("ROOM_ID")) {
            Long roomId = (Long) sessionAttributes.get("ROOM_ID");
            log.info("WebSocket disconnect detected: userSso={}, roomId={}", userSso, roomId);
            try {
                roomService.leaveRoom(roomId, userSso);
            } catch (Exception e) {
                log.warn("Auto leaveRoom failed during WebSocket disconnect: {}", e.getMessage());
            }
        }
    }
}
