package app.together.workflow.room.controller;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import app.together.workflow.room.dto.RoomDtos.JoinRoomRequest;
import app.together.workflow.room.dto.RoomDtos.RoomMemberActionRequest;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import app.together.workflow.room.dto.RoomDtos.RoomTimelineResponse;
import app.together.workflow.room.dto.RoomDtos.RoomWebRtcConfigResponse;
import app.together.workflow.room.service.RoomEventHandler;
import app.together.workflow.room.service.RoomService;
import app.together.workflow.room.service.RoomWebRtcConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workflow/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final RoomWebRtcConfigService roomWebRtcConfigService;
    private final RoomEventHandler roomEventHandler;

    @PostMapping
    public ApiResponse<RoomResponse> createRoom(@RequestBody CreateRoomRequest request) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.createRoom(currentUserSso, request));
    }

    @PostMapping("/{roomId}/join")
    public ApiResponse<RoomResponse> joinRoom(@PathVariable Long roomId, @RequestBody(required = false) JoinRoomRequest request) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.joinRoom(roomId, currentUserSso, request));
    }

    @PostMapping("/{roomId}/leave")
    public ApiResponse<RoomResponse> leaveRoom(@PathVariable Long roomId) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.leaveRoom(roomId, currentUserSso));
    }

    @PostMapping("/{roomId}/close")
    public ApiResponse<RoomResponse> closeRoom(@PathVariable Long roomId) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.closeRoom(roomId, currentUserSso));
    }

    @PostMapping("/{roomId}/open")
    public ApiResponse<RoomResponse> openRoom(@PathVariable Long roomId) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.openRoom(roomId, currentUserSso));
    }

    @PostMapping("/{roomId}/members/kick")
    public ApiResponse<RoomResponse> kickMember(@PathVariable Long roomId, @RequestBody RoomMemberActionRequest request) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.kickMember(roomId, currentUserSso, request));
    }

    @PostMapping("/{roomId}/members/promote-host")
    public ApiResponse<RoomResponse> promoteHost(@PathVariable Long roomId, @RequestBody RoomMemberActionRequest request) {
        String currentUserSso = requireCurrentUserSso();
        return ApiResponse.ok(roomService.promoteHost(roomId, currentUserSso, request));
    }

    @GetMapping("/{roomId}")
    public ApiResponse<RoomResponse> getRoom(@PathVariable Long roomId) {
        return ApiResponse.ok(roomService.getRoom(roomId));
    }

    @GetMapping("/{roomId}/webrtc-config")
    public ApiResponse<RoomWebRtcConfigResponse> getWebRtcConfig(@PathVariable Long roomId) {
        return ApiResponse.ok(roomWebRtcConfigService.getConfig(roomId));
    }

    @GetMapping("/{roomId}/timeline")
    public ApiResponse<RoomTimelineResponse> getTimeline(@PathVariable Long roomId) {
        return ApiResponse.ok(roomEventHandler.findTimeline(roomId));
    }

    private String requireCurrentUserSso() {
        return SecurityUtils.requireCurrentUserSso();
    }
}
