package app.together.workflow.room.dto;

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
            String roomType,
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

    public record CreateRoomRequest(
            String title,
            String description,
            String goalDescription,
            Integer goalDurationDays,
            Integer maxMembers,
            Boolean isPremium,
            Boolean isPublic,
            String roomType
    ) {
    }

    public record JoinRoomRequest(String inviteCode) {
    }

    public record RoomMemberActionRequest(String targetUserSso) {
    }

    public record TransferOwnerRequest(String targetUserSso) {
    }

    public record SignalMessage(
            String roomId,
            String fromUser,
            String toUser,
            String type,
            Object payload,
            Instant sentAt
    ) {
    }

    public record RoomEvent(
            String eventId,
            String correlationId,
            Integer version,
            String roomId,
            String type,
            String actor,
            Instant at,
            Object payload
    ) {
    }

    public record IceServerResponse(
            List<String> urls,
            String username,
            String credential
    ) {
    }

    public record RoomWebRtcConfigResponse(
            Long roomId,
            String roomType,
            Boolean enableAudio,
            Boolean enableVideo,
            Boolean enableChat,
            Boolean enableMic,
            Integer maxMembers,
            String videoResolution,
            List<IceServerResponse> iceServers
    ) {
    }

    public record RoomTimelineResponse(
            Long roomId,
            List<RoomTimelineItem> events
    ) {
    }

    public record RoomTimelineItem(
            Long roomId,
            String eventType,
            String actorSso,
            String payload,
            Instant eventAt
    ) {
    }
}
