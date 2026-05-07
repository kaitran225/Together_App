package com.project.exe.common.repository;

import com.project.exe.common.entity.RoomPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomPostRepository extends JpaRepository<RoomPost, Long> {

    List<RoomPost> findByRoomId(Long roomId);
}
