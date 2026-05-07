package com.project.exe.common.repository;

import com.project.exe.common.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserSso(String userSso);
}
