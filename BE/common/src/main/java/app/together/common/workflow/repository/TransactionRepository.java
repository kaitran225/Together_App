package app.together.common.workflow.repository;

import app.together.common.workflow.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserMasterDataId(Long userMasterDataId);

    List<Transaction> findByUserMasterDataIdOrderByCreatedAtDesc(Long userMasterDataId);
}
