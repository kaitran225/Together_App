package com.project.exe.common.repository;

import com.project.exe.common.entity.ScheduleException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScheduleExceptionRepository extends JpaRepository<ScheduleException, Long> {

    List<ScheduleException> findByScheduleId(Long scheduleId);
}
