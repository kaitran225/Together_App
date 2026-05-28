package app.together.workflow.room.service;

import app.together.common.auth.enums.RoomRole;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.repository.RoomRepository;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class RoomLifecycleService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;

    public RoomLifecycleService(RoomRepository roomRepository, RoomMemberRepository roomMemberRepository) {
        this.roomRepository = roomRepository;
        this.roomMemberRepository = roomMemberRepository;
    }

    public void createOwnerMember(Long roomId, String userSso, Instant now) {
        roomMemberRepository.save(RoomMember.builder()
                .roomId(roomId)
                .userSso(userSso)
                .role(RoomRole.HOST)
                .isActive(true)
                .joinedAt(now)
                .lastActiveAt(now)
                .build());
    }

    public void closeRoom(Room room, String userSso, Instant now) {
        room.setStatus("CLOSED");
        room.setClosedAt(now);
        room.setClosedBy(userSso);
        roomRepository.save(room);
    }

    public void openRoom(Room room) {
        room.setStatus("OPEN");
        room.setClosedAt(null);
        room.setClosedBy(null);
        roomRepository.save(room);
    }

    public void deactivateActiveMembers(List<RoomMember> members, Instant now) {
        for (RoomMember member : members) {
            if (Boolean.TRUE.equals(member.getIsActive())) {
                member.setIsActive(false);
                member.setLeftAt(now);
                member.setLastActiveAt(now);
            }
        }
    }

    public void syncRoomCapacityStatus(Room room) {
        throw new UnsupportedOperationException("Use RoomStateService for capacity sync");
    }

    public void transferOwner(RoomMember currentHost, RoomMember targetMember) {
        targetMember.setRole(RoomRole.HOST);
        currentHost.setRole(RoomRole.PARTICIPANT);
    }
}
