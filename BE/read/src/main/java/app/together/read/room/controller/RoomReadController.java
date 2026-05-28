package app.together.read.room.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.read.room.dto.RoomDtos.RoomResponse;
import app.together.read.room.service.RoomReadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/read/rooms")
@RequiredArgsConstructor
public class RoomReadController {

    private final RoomReadService roomReadService;

    @GetMapping("/{roomId}")
    public ApiResponse<RoomResponse> getRoom(@PathVariable Long roomId) {
        return ApiResponse.ok(roomReadService.getRoom(roomId));
    }
}
