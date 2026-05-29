package app.together.workflow.room.service;

import app.together.common.auth.enums.RoomRole;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.enums.RoomStatus;
import app.together.common.workflow.enums.RoomType;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import app.together.workflow.room.config.RoomMediaProperties;
import app.together.workflow.room.dto.RoomDtos.CreateRoomRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RoomStateService {

    private static final int INVITE_CODE_LENGTH = 8;

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final RoomValidator roomValidator;
    private final RoomMediaProperties roomMediaProperties;

    public Room buildRoom(CreateRoomRequest request, boolean isPublic, String userSso, Instant now) {
        RoomType roomType = roomValidator.resolveRoomType(request);
        RoomMediaProperties.Profile profile = roomMediaProperties.profileFor(roomType);
        Integer maxMembers = resolveMaxMembers(request, profile, roomType);

        Room room = Room.builder()
                .title(trimToNull(request.title()))
                .description(trimToNull(request.description()))
                .maxMembers(maxMembers)
                .roomType(roomType)
                .isPublic(isPublic)
                .inviteCode(isPublic ? null : generateInviteCode())
                .status(RoomStatus.OPEN.name())
                .activatedAt(now)
                .build();
        room.setCreatedBy(userSso);
        room.setUpdatedBy(userSso);
        return room;
    }

    public void syncRoomCapacityStatus(Room room) {
        if (room.getMaxMembers() == null) {
            return;
        }

        long activeMembers = roomMemberRepository.countByRoomIdAndIsActiveTrue(room.getRoomId());
        String nextStatus = activeMembers >= room.getMaxMembers() ? RoomStatus.FULL.name() : RoomStatus.OPEN.name();
        if (!Objects.equals(room.getStatus(), nextStatus)) {
            room.setStatus(nextStatus);
            roomRepository.save(room);
        }
    }

    public RoomMember reactivateMember(RoomMember member, Instant now) {
        member.setIsActive(true);
        member.setLastActiveAt(now);
        member.setLeftAt(null);
        if (member.getJoinedAt() == null) {
            member.setJoinedAt(now);
        }
        if (member.getRole() == null) {
            member.setRole(RoomRole.PARTICIPANT);
        }
        return member;
    }

    public RoomMember buildNewMember(Long roomId, String userSso, Instant now) {
        return RoomMember.builder()
                .roomId(roomId)
                .userSso(userSso)
                .role(RoomRole.PARTICIPANT)
                .isActive(true)
                .joinedAt(now)
                .lastActiveAt(now)
                .build();
    }

    public void closeRoom(Room room, String userSso, Instant now) {
        room.setStatus(RoomStatus.CLOSED.name());
        room.setClosedAt(now);
        room.setClosedBy(userSso);
        roomRepository.save(room);
    }

    public void openRoom(Room room) {
        room.setStatus(RoomStatus.OPEN.name());
        room.setClosedAt(null);
        room.setClosedBy(null);
        roomRepository.save(room);
    }

    public void deactivateMember(RoomMember member, Instant now) {
        member.setIsActive(false);
        member.setLeftAt(now);
        member.setLastActiveAt(now);
    }

    public void transferOwner(RoomMember currentHost, RoomMember targetMember) {
        targetMember.setRole(RoomRole.HOST);
        currentHost.setRole(RoomRole.PARTICIPANT);
    }

    public void deactivateActiveMembers(Iterable<RoomMember> members, Instant now) {
        for (RoomMember member : members) {
            if (Boolean.TRUE.equals(member.getIsActive())) {
                deactivateMember(member, now);
            }
        }
    }

    public void createOwnerMember(RoomMemberRepository roomMemberRepository, Long roomId, String userSso, Instant now) {
        roomMemberRepository.save(RoomMember.builder()
                .roomId(roomId)
                .userSso(userSso)
                .role(RoomRole.HOST)
                .isActive(true)
                .joinedAt(now)
                .lastActiveAt(now)
                .build());
    }

    private Integer resolveMaxMembers(CreateRoomRequest request, RoomMediaProperties.Profile profile, RoomType roomType) {
        if (request.maxMembers() != null && request.maxMembers() > 0) {
            return request.maxMembers();
        }
        return profile.defaultMaxMembers();
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, INVITE_CODE_LENGTH).toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
