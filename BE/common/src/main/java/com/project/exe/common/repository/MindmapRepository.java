package com.project.exe.common.repository;

import com.project.exe.common.entity.Mindmap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MindmapRepository extends JpaRepository<Mindmap, Long> {

    List<Mindmap> findByDocumentId(Long documentId);
}
