package com.project.exe.common.repository;

import com.project.exe.common.entity.RoomActivity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomActivityRepository extends JpaRepository<RoomActivity, Long> {

    List<RoomActivity> findByRoomId(Long roomId);
}
