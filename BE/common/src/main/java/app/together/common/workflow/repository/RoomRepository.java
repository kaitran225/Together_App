package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Room;
import app.together.common.workflow.enums.RoomType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RoomRepository extends JpaRepository<Room, Long> {

    Optional<Room> findByInviteCode(String inviteCode);

    List<Room> findByStatusAndRoomTypeAndDeletedAtIsNull(String status, RoomType roomType);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.createdBy = :createdBy AND r.status IN ('DRAFT', 'OPEN', 'FULL') AND r.deletedAt IS NULL")
    long countActiveRoomsByCreatedBy(@Param("createdBy") String createdBy);
}
