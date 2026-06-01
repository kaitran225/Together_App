package app.together.workflow.room.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import app.together.workflow.room.service.RoomMatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/v1/workflow/rooms/matching")
@RequiredArgsConstructor
public class RoomMatchingController {

    private final RoomMatchingService roomMatchingService;

    @PostMapping
    public ApiResponse<RoomResponse> matchRoom(@RequestBody CreateRoomRequest request){
        String currentUser = SecurityUtils.getCurrentUserSsoOrNull();
        return ApiResponse.ok(roomMatchingService.matchOrCreateRoom(currentUser, request));
    }
}
