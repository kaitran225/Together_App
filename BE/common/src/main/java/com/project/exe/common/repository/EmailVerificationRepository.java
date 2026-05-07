package com.project.exe.common.repository;

import com.project.exe.common.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByEmailAndVerificationCode(String email, String code);

    Optional<EmailVerification> findByVerificationCode(String verificationCode);
}
