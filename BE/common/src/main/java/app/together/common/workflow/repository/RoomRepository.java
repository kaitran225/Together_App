package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Room;
import app.together.common.workflow.enums.RoomType;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByInviteCode(String inviteCode);

    List<Room> findByStatusAndRoomTypeAndDeletedAtIsNull(String status, RoomType roomType);
}
