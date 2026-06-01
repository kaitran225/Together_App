package app.together.workflow.room.controller;

import app.together.workflow.room.dto.RoomDtos.ChatMessage;
import app.together.workflow.room.dto.RoomDtos.SignalMessage;
import app.together.workflow.room.service.RoomRealtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class RoomSignalController {

    private final RoomRealtimeService roomRealtimeService;

    @MessageMapping("/room.signal")
    public void signal(@Payload SignalMessage message) {
        roomRealtimeService.signal(message);
    }

    @MessageMapping("/room.chat")
    public void chat(@Payload ChatMessage message) {
        roomRealtimeService.broadcastChat(message);
    }
}
