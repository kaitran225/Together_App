package com.project.exe.common.repository;

import com.project.exe.common.entity.Flashcard;
import com.project.exe.common.entity.FlashcardId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardRepository extends JpaRepository<Flashcard, FlashcardId> {

    List<Flashcard> findByQuizId(Long quizId);
}
