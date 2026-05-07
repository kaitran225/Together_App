package com.project.exe.common.repository;

import com.project.exe.common.entity.UserMasterData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserMasterDataRepository extends JpaRepository<UserMasterData, Long> {

    Optional<UserMasterData> findByUserSso(String userSso);
}
