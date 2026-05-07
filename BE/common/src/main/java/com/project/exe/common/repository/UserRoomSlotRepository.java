package com.project.exe.common.repository;

import com.project.exe.common.entity.UserRoomSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRoomSlotRepository extends JpaRepository<UserRoomSlot, Long> {

    Optional<UserRoomSlot> findByUserId(Long userId);
}
