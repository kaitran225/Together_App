package app.together.workflow.room.service;

import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.workflow.room.dto.RoomDtos.RoomMemberResponse;
import app.together.workflow.room.dto.RoomDtos.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RoomResponseMapper {

    public RoomResponse toRoomResponse(Room room, List<RoomMember> members) {
        List<RoomMemberResponse> memberResponses = members.stream()
                .map(member -> new RoomMemberResponse(
                        member.getRoomId(),
                        member.getUserSso(),
                        member.getRole(),
                        member.getIsActive(),
                        member.getJoinedAt(),
                        member.getLeftAt(),
                        member.getLastActiveAt()))
                .toList();

        return new RoomResponse(
                room.getRoomId(),
                room.getTitle(),
                room.getDescription(),
                room.getInviteCode(),
                room.getStatus(),
                room.getIsPublic(),
                room.getMaxMembers(),
                room.getRoomType() == null ? null : room.getRoomType().name(),
                room.getActivatedAt(),
                room.getExpiresAt(),
                room.getClosedAt(),
                memberResponses);
    }
}
