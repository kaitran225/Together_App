package com.project.exe.common.repository;

import com.project.exe.common.entity.RoomMember;
import com.project.exe.common.entity.RoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    List<RoomMember> findByRoomId(Long roomId);

    List<RoomMember> findByUserSso(String userSso);
}
