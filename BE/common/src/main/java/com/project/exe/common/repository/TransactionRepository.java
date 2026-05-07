package com.project.exe.common.repository;

import com.project.exe.common.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserMasterDataId(Long userMasterDataId);
}
