package com.project.exe.common.repository;

import com.project.exe.common.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    List<StudySession> findByUserMasterDataId(Long userMasterDataId);
}
