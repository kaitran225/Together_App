package com.project.exe.common.repository;

import com.project.exe.common.entity.RoomRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomRequestRepository extends JpaRepository<RoomRequest, Long> {

    List<RoomRequest> findByUserSso(String userSso);
}
