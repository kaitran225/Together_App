package app.together.common.workflow.repository;

import app.together.common.workflow.entity.RoomEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomEventRepository extends JpaRepository<RoomEventEntity, Long> {

    List<RoomEventEntity> findByRoomIdOrderByEventAtDesc(Long roomId);
}
