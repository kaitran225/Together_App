package com.project.exe.common.repository;

import com.project.exe.common.entity.QuickNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuickNoteRepository extends JpaRepository<QuickNote, Long> {

    List<QuickNote> findByUserSso(String userSso);
}
