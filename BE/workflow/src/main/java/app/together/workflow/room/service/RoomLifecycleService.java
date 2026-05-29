package app.together.workflow.room.service;

import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.repository.RoomMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
@RequiredArgsConstructor
public class RoomLifecycleService {

    private final RoomStateService roomStateService;

    public void createOwnerMember(RoomMemberRepository roomMemberRepository, Long roomId, String userSso, Instant now) {
        roomStateService.createOwnerMember(roomMemberRepository, roomId, userSso, now);
    }

    public void closeRoom(Room room, String userSso, Instant now) {
        roomStateService.closeRoom(room, userSso, now);
    }

    public void openRoom(Room room) {
        roomStateService.openRoom(room);
    }

    public void deactivateActiveMembers(List<RoomMember> members, Instant now) {
        roomStateService.deactivateActiveMembers(members, now);
    }

    public void transferOwner(RoomMember currentHost, RoomMember targetMember) {
        roomStateService.transferOwner(currentHost, targetMember);
    }

    public void syncRoomCapacityStatus(Room room) {
        roomStateService.syncRoomCapacityStatus(room);
    }
}
