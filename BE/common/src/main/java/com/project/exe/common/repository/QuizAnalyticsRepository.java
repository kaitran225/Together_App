package com.project.exe.common.repository;

import com.project.exe.common.entity.QuizAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizAnalyticsRepository extends JpaRepository<QuizAnalytics, Long> {

    Optional<QuizAnalytics> findByUserMasterDataId(Long userMasterDataId);
}
