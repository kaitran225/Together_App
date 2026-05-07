package com.project.exe.common.repository;

import com.project.exe.common.entity.Summary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SummaryRepository extends JpaRepository<Summary, Long> {

    List<Summary> findByDocumentId(Long documentId);
}
