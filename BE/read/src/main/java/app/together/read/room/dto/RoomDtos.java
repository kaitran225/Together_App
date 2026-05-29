package app.together.read.room.dto;

import java.time.Instant;
import java.util.List;

import app.together.common.auth.enums.RoomRole;

public final class RoomDtos {

    private RoomDtos() {
    }

    public record RoomResponse(
            Long roomId,
            String title,
            String description,
            String inviteCode,
            String status,
            Boolean isPublic,
            Integer maxMembers,
            Instant activatedAt,
            Instant expiresAt,
            Instant closedAt,
            List<RoomMemberResponse> members
    ) {
    }

    public record RoomMemberResponse(
            Long roomId,
            String userSso,
            RoomRole role,
            Boolean isActive,
            Instant joinedAt,
            Instant leftAt,
            Instant lastActiveAt
    ) {
    }
}
