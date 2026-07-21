package app.together.common.workflow.repository;

import app.together.common.workflow.entity.TeamMember;
import app.together.common.workflow.entity.TeamMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, TeamMemberId> {

    List<TeamMember> findByTeamId(Long teamId);

    List<TeamMember> findByUserSso(String userSso);

    Boolean existsByTeamIdAndUserSsoAndLeftAtIsNull(Long teamId, String userSso);
}
