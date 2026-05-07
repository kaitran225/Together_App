package com.project.exe.common.repository;

import com.project.exe.common.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {

    java.util.Optional<Team> findByInviteCode(String inviteCode);
}
