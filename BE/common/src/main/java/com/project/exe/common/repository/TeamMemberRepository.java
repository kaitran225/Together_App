package com.project.exe.common.repository;

import com.project.exe.common.entity.TeamMember;
import com.project.exe.common.entity.TeamMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {

    List<TeamMember> findByTeamId(Long teamId);

    List<TeamMember> findByUserSso(String userSso);
}
