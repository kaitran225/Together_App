package app.together.read.room.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.workflow.entity.RoomEventEntity;
import app.together.read.room.service.RoomReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/read/rooms")
@RequiredArgsConstructor
public class RoomEventReadController {

    private final RoomReadService roomReadService;

    @GetMapping("/{roomId}/events")
    public ApiResponse<List<RoomEventEntity>> getTimeline(@PathVariable Long roomId) {
        return ApiResponse.ok(roomReadService.getTimeline(roomId));
    }
}
