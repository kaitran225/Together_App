package com.project.exe.common.repository;

import com.project.exe.common.entity.FlashcardReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardReviewRepository extends JpaRepository<FlashcardReview, Long> {

    List<FlashcardReview> findByFlashcardId(Long flashcardId);
}
