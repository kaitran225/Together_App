package com.project.exe.common.repository;

import com.project.exe.common.entity.UserAchievement;
import com.project.exe.common.entity.UserAchievementId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievementId> {

    List<UserAchievement> findByUserId(Long userId);
}
