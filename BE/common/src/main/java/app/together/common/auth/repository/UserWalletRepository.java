package app.together.common.auth.repository;

import app.together.common.auth.entity.UserWallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserWalletRepository extends JpaRepository<UserWallet, Long> {

    Optional<UserWallet> findByUserId(Long userId);

    @Query("SELECT uw FROM UserWallet uw JOIN User u ON uw.userId = u.userId WHERE u.userSso = :userSso")
    Optional<UserWallet> findByUserSso(@Param("userSso") String userSso);
}
