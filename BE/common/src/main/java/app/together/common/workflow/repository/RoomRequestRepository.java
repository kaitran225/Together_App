package app.together.common.workflow.repository;

import app.together.common.workflow.entity.RoomRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRequestRepository extends JpaRepository<RoomRequest, Long> {

    List<RoomRequest> findByUserSso(String userSso);
    List<RoomRequest> findByStatusAndExpiresAtAfter(String status, java.time.Instant now);
}
