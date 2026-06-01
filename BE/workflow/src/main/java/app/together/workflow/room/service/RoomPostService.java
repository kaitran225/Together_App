package app.together.workflow.room.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.ForbiddenException;
import app.together.common.workflow.entity.RoomPost;
import app.together.common.workflow.repository.RoomPostRepository;
import app.together.workflow.room.dto.RoomDtos.CreatePostRequest;
import app.together.workflow.room.dto.RoomDtos.RoomPostResponse;
import io.undertow.util.BadRequestException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomPostService {

    private final RoomPostRepository roomPostRepository;
    private final RoomGuardService roomGuardServicel;

    public RoomPostResponse createPost(Long roomId, String userSso, CreatePostRequest request) throws BadRequestException {
        roomGuardServicel.requireActiveMember(roomId, userSso);
        if (request.content() == null || request.content().isBlank()) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_TITLE_REQUIRED);
        }

        RoomPost post = RoomPost.builder()
                .roomId(roomId)
                .userSso(userSso)
                .parentPostId(request.parentPostId())
                .content(request.content())
                .attachments(request.attachments())
                .isPinned(false)
                .build();

        RoomPost saved = roomPostRepository.save(post);
        return toPostResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RoomPostResponse> getRoomPosts(Long roomId, String userSso) {
        roomGuardServicel.requireActiveMember(roomId, userSso);
        return roomPostRepository.findByRoomIdAndDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(roomId).stream()
                .map(this::toPostResponse)
                .toList();
    }

    public RoomPostResponse togglePinPost(Long roomId, Long postId, String userSso) throws BadRequestException {
        roomGuardServicel.requireHost(roomId, userSso); // Chỉ Host mới được ghim

        RoomPost post = roomPostRepository.findById(postId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_ROOM_POST_NOT_FOUND));

        if (!post.getRoomId().equals(roomId)) {
            throw new ForbiddenException(MessageConstants.MESSAGE_INVALID);
        }

        post.setIsPinned(!Boolean.TRUE.equals(post.getIsPinned()));
        return toPostResponse(roomPostRepository.save(post));
    }

    public void deletePost(Long roomId, Long postId, String userSso) throws BadRequestException {
        RoomPost post = roomPostRepository.findById(postId)
                .orElseThrow(() -> new BadRequestException(MessageConstants.MESSAGE_ROOM_POST_NOT_FOUND));

        // Người đăng hoặc Host có quyền xóa bài đăng
        boolean isOwner = post.getUserSso().equals(userSso);
        boolean isHost = false;
        try {
            roomGuardServicel.requireHost(roomId, userSso);
            isHost = true;
        } catch (Exception ignored) {}

        if (!isOwner && !isHost) {
            throw new ForbiddenException(MessageConstants.MESSAGE_INVALID);
        }

        post.setDeletedAt(Instant.now());
        roomPostRepository.save(post);
    }

    private RoomPostResponse toPostResponse(RoomPost post) {
        return new RoomPostResponse(
                post.getPostId(),
                post.getRoomId(),
                post.getUserSso(),
                post.getParentPostId(),
                post.getContent(),
                post.getAttachments(),
                post.getIsPinned(),
                post.getCreatedAt());
    }
}
