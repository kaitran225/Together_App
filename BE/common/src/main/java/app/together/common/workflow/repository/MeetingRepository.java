package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Meeting;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    Optional<Meeting> findByTeamId(Long teamId);
}
