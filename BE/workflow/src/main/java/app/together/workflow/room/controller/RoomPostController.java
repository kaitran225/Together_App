package app.together.workflow.room.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.util.SecurityUtils;
import app.together.workflow.room.dto.RoomDtos.CreatePostRequest;
import app.together.workflow.room.dto.RoomDtos.RoomPostResponse;
import app.together.workflow.room.service.RoomPostService;
import io.undertow.util.BadRequestException;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/workflow/rooms/{roomId}/posts")
@RequiredArgsConstructor
public class RoomPostController {

    private final RoomPostService roomPostService;

    @PostMapping
    public ApiResponse<RoomPostResponse> createPost(@PathVariable Long roomId, @RequestBody CreatePostRequest request) throws BadRequestException{
        String currentUser = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(roomPostService.createPost(roomId, currentUser, request));
    }

    @GetMapping
    public ApiResponse<List<RoomPostResponse>> getRoomPosts(@PathVariable Long roomId) {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(roomPostService.getRoomPosts(roomId, currentUserSso));
    }

    @PostMapping("/{postId}/pin")
    public ApiResponse<RoomPostResponse> pinPost(@PathVariable Long roomId, @PathVariable Long postId) throws BadRequestException {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        return ApiResponse.ok(roomPostService.togglePinPost(roomId, postId, currentUserSso));
    }

    @DeleteMapping("/{postId}")
    public ApiResponse<Void> deletePost(@PathVariable Long roomId, @PathVariable Long postId) throws BadRequestException {
        String currentUserSso = SecurityUtils.requireCurrentUserSso();
        roomPostService.deletePost(roomId, postId, currentUserSso);
        return ApiResponse.ok(null);
    }

}
