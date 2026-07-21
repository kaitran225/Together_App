package app.together.common.workflow.repository;

import app.together.common.workflow.entity.RoomPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomPostRepository extends JpaRepository<RoomPost, Long> {

    List<RoomPost> findByRoomId(Long roomId);
    List<RoomPost> findByRoomIdAndDeletedAtIsNullOrderByIsPinnedDescCreatedAtDesc(Long roomId);
}
