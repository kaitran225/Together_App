package app.together.read.room.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.read.room.dto.RoomDtos.RoomMemberResponse;
import app.together.read.room.dto.RoomDtos.RoomResponse;
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
public class RoomReadController {

    private final RoomReadService roomReadService;

    @GetMapping
    public ApiResponse<List<RoomResponse>> getActiveRooms() {
        return ApiResponse.ok(roomReadService.getActiveRooms());
    }

    @GetMapping("/{roomId}")
    public ApiResponse<RoomResponse> getRoom(@PathVariable Long roomId) {
        return ApiResponse.ok(roomReadService.getRoom(roomId));
    }

    @GetMapping("/my")
    public ApiResponse<List<RoomResponse>> getMyRooms() {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(roomReadService.getMyRooms(currentUserSso));
    }

    @GetMapping("/suggested")
    public ApiResponse<List<RoomResponse>> getSuggestedRooms() {
        return ApiResponse.ok(roomReadService.getSuggestedRooms());
    }

    @GetMapping("/{roomId}/participants")
    public ApiResponse<List<RoomMemberResponse>> getRoomParticipants(@PathVariable Long roomId) {
        return ApiResponse.ok(roomReadService.getRoomParticipants(roomId));
    }
}
