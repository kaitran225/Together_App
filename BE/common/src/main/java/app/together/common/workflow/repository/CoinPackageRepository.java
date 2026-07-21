package app.together.common.workflow.repository;

import app.together.common.workflow.entity.CoinPackage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CoinPackageRepository extends JpaRepository<CoinPackage, Long> {
    java.util.List<CoinPackage> findByIsActiveTrueOrderByDisplayOrderAsc();
}
