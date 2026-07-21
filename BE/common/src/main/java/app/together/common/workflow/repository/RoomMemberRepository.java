package app.together.common.workflow.repository;

import app.together.common.workflow.entity.RoomMember;
import app.together.common.workflow.entity.RoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    List<RoomMember> findByRoomId(Long roomId);

    List<RoomMember> findByUserSso(String userSso);

    long countByRoomIdAndIsActiveTrue(Long roomId);
}
