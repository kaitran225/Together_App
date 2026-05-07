package com.project.exe.common.repository;

import com.project.exe.common.entity.AppConfig;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppConfigRepository extends JpaRepository<AppConfig, String> {

    Optional<AppConfig> findByConfigKey(String configKey);
}
