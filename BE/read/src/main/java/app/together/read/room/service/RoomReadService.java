package app.together.read.room.service;

import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomEventEntity;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.enums.RoomRequestStatus;
import app.together.common.workflow.repository.RoomEventRepository;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import app.together.read.room.dto.RoomDtos.RoomMemberResponse;
import app.together.read.room.dto.RoomDtos.RoomResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoomReadService {

    private static final String ROOM_RESOURCE = "Room";

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomEventRepository roomEventRepository;

    public Room requireRoom(Long roomId) {
        if (roomId == null) {
            throw new BadRequestException(MessageConstants.MESSAGE_ROOM_INVALID);
        }
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException(ROOM_RESOURCE, roomId));
    }

    public RoomResponse getRoom(Long roomId) {
        Room room = requireRoom(roomId);
        List<RoomMemberResponse> members = roomMemberRepository.findByRoomId(roomId).stream()
                .map(this::toMemberResponse)
                .toList();

        return new RoomResponse(
                room.getRoomId(),
                room.getTitle(),
                room.getDescription(),
                room.getGoalDescription(),
                room.getGoalDurationDays(),
                room.getIsPremium(),
                room.getInviteCode(),
                room.getStatus(),
                room.getIsPublic(),
                room.getMaxMembers(),
                room.getTopic(),
                room.getActivatedAt(),
                room.getExpiresAt(),
                room.getClosedAt(),
                members);
    }

    public List<RoomResponse> getActiveRooms() {
        return roomRepository.findAll().stream()
                .filter(room -> isBrowsable(room) && Boolean.TRUE.equals(room.getIsPublic()))
                .map(room -> {
                    List<RoomMemberResponse> members = roomMemberRepository.findByRoomId(room.getRoomId()).stream()
                            .map(this::toMemberResponse)
                            .toList();
                    return toRoomResponse(room, members);
                })
                .toList();
    }

    public List<RoomResponse> getMyRooms(String userSso) {
        List<RoomMember> memberships = roomMemberRepository.findByUserSso(userSso);
        List<Long> roomIds = memberships.stream()
                .map(RoomMember::getRoomId)
                .toList();

        return roomRepository.findAllById(roomIds).stream()
                .filter(this::isBrowsable)
                .map(room -> {
                    List<RoomMemberResponse> members = roomMemberRepository.findByRoomId(room.getRoomId()).stream()
                            .map(this::toMemberResponse)
                            .toList();
                    return toRoomResponse(room, members);
                })
                .toList();
    }

    public List<RoomResponse> getSuggestedRooms() {
        List<Room> activeRooms = roomRepository.findAll().stream()
                .filter(room -> isBrowsable(room) && Boolean.TRUE.equals(room.getIsPublic()))
                .toList();

        activeRooms.sort((room1, room2) -> Long.compare(
                roomMemberRepository.countByRoomIdAndIsActiveTrue(room2.getRoomId()),
                roomMemberRepository.countByRoomIdAndIsActiveTrue(room1.getRoomId())
        ));

        return activeRooms.stream()
                .limit(5)
                .map(room -> {
                    List<RoomMemberResponse> members = roomMemberRepository.findByRoomId(room.getRoomId()).stream()
                            .map(this::toMemberResponse)
                            .toList();
                    return toRoomResponse(room, members);
                })
                .toList();
    }

    private boolean isBrowsable(Room room) {
        if (room.getDeletedAt() != null) {
            return false;
        }
        String status = room.getStatus();
        if (status == null || RoomRequestStatus.EXPIRED.name().equalsIgnoreCase(status)) {
            return false;
        }
        return "OPEN".equalsIgnoreCase(status) || "FULL".equalsIgnoreCase(status);
    }

    private RoomResponse toRoomResponse(Room room, List<RoomMemberResponse> members) {
        return new RoomResponse(
                room.getRoomId(),
                room.getTitle(),
                room.getDescription(),
                room.getGoalDescription(),
                room.getGoalDurationDays(),
                room.getIsPremium(),
                room.getInviteCode(),
                room.getStatus(),
                room.getIsPublic(),
                room.getMaxMembers(),
                room.getTopic(),
                room.getActivatedAt(),
                room.getExpiresAt(),
                room.getClosedAt(),
                members);
    }

    public List<RoomMemberResponse> getRoomParticipants(Long roomId) {
        requireRoom(roomId); // First, ensure the room exists.
        return roomMemberRepository.findByRoomId(roomId).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    public List<RoomEventEntity> getTimeline(Long roomId) {
        requireRoom(roomId);
        return roomEventRepository.findByRoomIdOrderByEventAtDesc(roomId);
    }

    private RoomMemberResponse toMemberResponse(RoomMember member) {
        return new RoomMemberResponse(
                member.getRoomId(),
                member.getUserSso(),
                member.getRole(),
                member.getIsActive(),
                member.getJoinedAt(),
                member.getLeftAt(),
                member.getLastActiveAt());
    }
}
