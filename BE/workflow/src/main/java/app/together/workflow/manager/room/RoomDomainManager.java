package app.together.workflow.manager.room;

import app.together.common.auth.enums.RoomRole;
import app.together.common.workflow.entity.Room;
import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.repository.RoomMemberRepository;
import app.together.common.workflow.enums.RoomType;

import java.time.Instant;
import java.util.List;

public interface RoomDomainManager {

    RoomType supportedType();

    default boolean supports(RoomType roomType) {
        return supportedType() != null && supportedType().equals(roomType);
    }

    default void validateJoinPolicy(Room room) {
    }

    default void createOwnerMember(RoomMemberRepository roomMemberRepository, Long roomId, String userSso, Instant now) {
        roomMemberRepository.save(RoomMember.builder()
                .roomId(roomId)
                .userSso(userSso)
                .role(RoomRole.HOST)
                .isActive(true)
                .joinedAt(now)
                .lastActiveAt(now)
                .build());
    }

    default void transferOwner(RoomMember currentHost, RoomMember targetMember) {
        targetMember.setRole(RoomRole.HOST);
        currentHost.setRole(RoomRole.PARTICIPANT);
    }

    default void deactivateActiveMembers(List<RoomMember> members, Instant now) {
        for (RoomMember member : members) {
            if (Boolean.TRUE.equals(member.getIsActive())) {
                member.setIsActive(false);
                member.setLeftAt(now);
                member.setLastActiveAt(now);
            }
        }
    }
}
