package com.project.exe.common.repository;

import com.project.exe.common.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    List<Meeting> findByTeamId(Long teamId);
}
