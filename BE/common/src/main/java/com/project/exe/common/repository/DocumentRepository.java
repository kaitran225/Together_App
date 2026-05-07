package com.project.exe.common.repository;

import com.project.exe.common.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByUserSso(String userSso);
}
