package com.project.exe.common.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.project.exe.common.constant.ErrorCodes;
import com.project.exe.common.constant.MessageConstants;
import com.project.exe.common.dto.UserDto;
import com.project.exe.common.dto.auth.*;
import com.project.exe.common.entity.EmailVerification;
import com.project.exe.common.entity.PasswordReset;
import com.project.exe.common.entity.User;
import com.project.exe.common.enums.SubcriptionType;
import com.project.exe.common.enums.UserStatus;
import com.project.exe.common.exception.BadRequestException;
import com.project.exe.common.exception.ConflictException;
import com.project.exe.common.exception.ResourceNotFoundException;
import com.project.exe.common.exception.UnauthorizedException;
import com.project.exe.common.mapper.UserMapper;
import com.project.exe.common.repository.EmailVerificationRepository;
import com.project.exe.common.repository.PasswordResetRepository;
import com.project.exe.common.repository.UserRepository;
import com.project.exe.common.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.security.SecurityUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordResetRepository passwordResetRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;
    private final EmailService emailService;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.jwt.expiration}")
    private long expirationTime;

    @Value("${spring.jwt.refresh-token-expiration}")
    private long refreshTokenExpirationTime;



    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Thông tin đăng nhập không hợp lệ", ErrorCodes.UNAUTHORIZED));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Thông tin đăng nhập không hợp lệ", ErrorCodes.UNAUTHORIZED);
        }

        return buildLoginResponse(user);
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email đã tồn tại", MessageConstants.MESSAGE_USER_EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .userSso(generateUserSso())
                .planType(SubcriptionType.FREE.toString())
                .metadata("{}")
                .exp(0)
                .emailVerified(false)
                .status(UserStatus.ACTIVE.toString())
                .isAdmin(false)
                .build();

        user = userRepository.save(user);

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = tokenService.hashToken(rawToken);

        EmailVerification emailVerification = EmailVerification.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .verificationCode(hashedToken)
                .expiresAt(Instant.now().plus(Duration.ofHours(24))) // Hết hạn sau 24h
                .attempts(0)
                .isEduEmail(user.getEmail().endsWith(".edu.vn") || user.getEmail().endsWith(".edu"))
                .build();
        emailVerificationRepository.save(emailVerification);

        System.out.println("DEBUG: Link xác thực cho user: http://localhost:5173/verify-email?token=" + rawToken);

        emailService.sendVerifycationEmail(user.getEmail(), rawToken);

        return userMapper.toDto(user);
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            tokenService.revokeRefreshToken(refreshToken);
        }
    }

    @Transactional
    public LoginResponse refreshToken(String refreshToken) {
        User user = tokenService.validateRefreshToken(refreshToken)
                .orElseThrow(() -> new UnauthorizedException(
                        "Token làm mới không hợp lệ hoặc đã hết hạn",
                        MessageConstants.MESSAGE_REFRESH_TOKEN_INVALID));

        tokenService.revokeRefreshToken(refreshToken);
        return buildLoginResponse(user);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        // Always return success to prevent user enumeration
        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString();
            String tokenHash = tokenService.hashToken(rawToken);

            PasswordReset reset = PasswordReset.builder()
                    .userId(user.getUserId())
                    .resetTokenHash(tokenHash)
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .build();

            passwordResetRepository.save(reset);

            emailService.sendResetPasswordEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void confirmPasswordReset(ConfirmPasswordResetRequest request) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()) {
            throw new BadRequestException(
                    "Token đặt lại mật khẩu là bắt buộc",
                    MessageConstants.MESSAGE_PASSWORD_RESET_INVALID);
        }
        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new BadRequestException(
                    "Mật khẩu mới là bắt buộc",
                    MessageConstants.MESSAGE_PASSWORD_RESET_INVALID);
        }

        String tokenHash = tokenService.hashToken(request.getToken());
        PasswordReset reset = passwordResetRepository.findByResetTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException(
                        "Token đặt lại không hợp lệ",
                        MessageConstants.MESSAGE_PASSWORD_RESET_INVALID));

        if (reset.getUsedAt() != null) {
            throw new BadRequestException(
                    "Token đặt lại đã được sử dụng",
                    MessageConstants.MESSAGE_PASSWORD_RESET_INVALID);
        }

        if (reset.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                    "Token đặt lại đã hết hạn",
                    MessageConstants.MESSAGE_PASSWORD_RESET_EXPIRED);
        }

        User user = userRepository.findById(reset.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng",
                        MessageConstants.MESSAGE_USER_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        reset.setUsedAt(Instant.now());
        passwordResetRepository.save(reset);

        tokenService.revokeAllUserRefreshTokens(user.getUserId());
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String userSso) {
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng với userSso: " + userSso,
                        MessageConstants.MESSAGE_USER_NOT_FOUND));
        return userMapper.toDto(user);
    }

    private LoginResponse buildLoginResponse(User user) {
        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);

        LoginResponse response = new LoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType("Bearer");
        response.setExpiresIn(expirationTime);
        response.setRefreshTokenExpiresIn(refreshTokenExpirationTime);

        response.setPlan_type(user.getPlanType());
        response.setExp(user.getExp());
        return response;
    }

    private String generateUserSso(){
        return "USER_" + UUID.randomUUID().toString().substring(0 ,8).toUpperCase();
    }

    private String generateGoogleUserSso(){
        return "GOOGLE_" + UUID.randomUUID().toString().substring(0 ,8).toUpperCase();
    }

    public String verifyAndGetMailFromGoogle(String idTokenString){
        try{
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singleton(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if(idToken != null){
                GoogleIdToken.Payload payload = idToken.getPayload();
                return payload.getEmail();
            } else {
                throw new UnauthorizedException("Token Google không hợp lệ", ErrorCodes.UNAUTHORIZED);
            }

        } catch (Exception e){
            throw new UnauthorizedException("Xác minh token Google thất bại: " + e.getMessage(), ErrorCodes.UNAUTHORIZED);
        }
    }

    @Transactional
    public LoginResponse loginWithGoogle(String googleToken){
        String email = verifyAndGetMailFromGoogle(googleToken);

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .userSso(generateGoogleUserSso())
                    .planType(SubcriptionType.FREE.toString())
                    .metadata("{}")
                    .exp(0)
                    .emailVerified(true)
                    .status(UserStatus.ACTIVE.toString())
                    .isAdmin(false)
                    .build();
            return userRepository.save(newUser);
        });

        return buildLoginResponse(user);
    }

    @Transactional
    public void verifyEmail(String rawToken){
        String hashedToken = tokenService.hashToken(rawToken);

        EmailVerification verification = emailVerificationRepository.findByVerificationCode(hashedToken)
                .orElseThrow(() -> new BadRequestException(
                        "Mã xác thức không hợp lệ",
                        MessageConstants.MESSAGE_EMAIL_VERIFICATION_INVALID
                ));

        if (verification.getAttempts() != null && verification.getAttempts() >= 5) {
            throw new BadRequestException("Bạn đã thử quá nhiều lần. Vui lòng yêu cầu mã mới.");
        }

        if (verification.getVerifiedAt() != null) {
            throw new BadRequestException("Email này đã được xác thực trước đó",
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_ALREADY_USED);
        }

        if(verification.getExpiresAt().isBefore(Instant.now())){
            throw new BadRequestException("Mã xác thực đã hết hạn",
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_EXPIRED);
        }

        User user = userRepository.findById(verification.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng", "USER_NOT_FOUND"));

        user.setEmailVerified(true);
        userRepository.save(user);

        verification.setVerifiedAt(Instant.now());
        verification.setAttempts((verification.getAttempts() == null ? 0 : verification.getAttempts()) + 1);

        emailVerificationRepository.save(verification);
    }

    @Transactional
    public ChangePasswordRequest changePasswordRequest(String oldPassword, String newPassword){
        String userSsoOrNull = SecurityUtils.getCurrentUserSsoOrNull();

        User user = userRepository.findByUserSso(userSsoOrNull)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy người dùng với userSso: " + userSsoOrNull,
                        MessageConstants.MESSAGE_USER_NOT_FOUND));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BadRequestException(
                    "Mật khẩu cũ không chính xác",
                    MessageConstants.MESSAGE_PASSWORD_RESET_NOT_FOUND);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenService.revokeAllUserRefreshTokens(user.getUserId());

        ChangePasswordRequest response = new ChangePasswordRequest();
        response.setNewPassword("Mật khẩu đã được thay đổi thành công");
        return response;
    }
}
