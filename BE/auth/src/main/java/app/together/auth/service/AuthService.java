package app.together.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import app.together.common.auth.dto.ConfirmPasswordResetRequest;
import app.together.common.auth.dto.LoginRequest;
import app.together.common.auth.dto.LoginResponse;
import app.together.common.auth.dto.RegisterRequest;
import app.together.common.auth.dto.UserDto;
import app.together.common.auth.entity.EmailVerification;
import app.together.common.auth.entity.PasswordReset;
import app.together.common.auth.entity.User;
import app.together.common.auth.enums.SystemRole;
import app.together.common.auth.mapper.UserMapper;
import app.together.common.auth.repository.EmailVerificationRepository;
import app.together.common.auth.repository.PasswordResetRepository;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.constant.ErrorCodes;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.dto.ApiResponse;
import app.together.common.shared.exception.BadRequestException;
import app.together.common.shared.exception.ConflictException;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.shared.exception.UnauthorizedException;
import app.together.common.shared.util.SecurityUtils;
import app.together.common.workflow.enums.SubcriptionType;
import app.together.common.workflow.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;
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
    private final EmailDispatchClient emailDispatchClient;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        if (request == null || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()) {
            throw new UnauthorizedException(
                    MessageConstants.MESSAGE_LOGIN_INVALID_CREDENTIALS,
                    ErrorCodes.UNAUTHORIZED);
        }

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UnauthorizedException(
                        MessageConstants.MESSAGE_LOGIN_INVALID_CREDENTIALS, ErrorCodes.UNAUTHORIZED));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new UnauthorizedException(MessageConstants.MESSAGE_LOGIN_INVALID_CREDENTIALS,
                    ErrorCodes.UNAUTHORIZED);
        }

        checkValidUser(user);
        return buildLoginResponse(user);
    }

    @Transactional
    public UserDto register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ConflictException(
                    MessageConstants.MESSAGE_USER_EMAIL_ALREADY_EXISTS,
                    ErrorCodes.USER_EMAIL_ALREADY_EXISTS);
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .userSso(generateUserSso())
                .planType(SubcriptionType.FREE.toString())
                .exp(0)
                .level(1)
                .metadata("{}")
                .emailVerified(false)
                .status(UserStatus.PENDING.toString())
                .systemRole(SystemRole.USER)
                .build();

        user = userRepository.save(user);

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = tokenService.hashToken(rawToken);

        EmailVerification emailVerification = EmailVerification.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .verificationCode(hashedToken)
                .expiresAt(Instant.now().plus(Duration.ofHours(24)))
                .attempts(0)
                .isEduEmail(user.getEmail().endsWith(".edu.vn") || user.getEmail().endsWith(".edu"))
                .build();
        emailVerificationRepository.save(emailVerification);
        emailDispatchClient.sendVerificationEmail(user.getEmail(), rawToken);

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
                        MessageConstants.MESSAGE_REFRESH_TOKEN_INVALID,
                        ErrorCodes.UNAUTHORIZED_TOKEN));

        tokenService.revokeRefreshToken(refreshToken);
        return buildLoginResponse(user);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString();
            String tokenHash = tokenService.hashToken(rawToken);

            PasswordReset reset = PasswordReset.builder()
                    .userId(user.getUserId())
                    .resetTokenHash(tokenHash)
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .build();

            passwordResetRepository.save(reset);

            emailDispatchClient.sendResetPasswordEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void confirmPasswordReset(ConfirmPasswordResetRequest request) {
        if (request == null || request.token() == null || request.token().isBlank()) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_PASSWORD_RESET_TOKEN_REQUIRED,
                    ErrorCodes.VALIDATION_FAILED_TOKEN);
        }
        if (request.newPassword() == null || request.newPassword().isBlank()) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_USER_NEW_PASSWORD_REQUIRED,
                    ErrorCodes.VALIDATION_FAILED);
        }

        String tokenHash = tokenService.hashToken(request.token());
        PasswordReset reset = passwordResetRepository.findByResetTokenHash(tokenHash)
                .orElseThrow(() -> new BadRequestException(
                        MessageConstants.MESSAGE_PASSWORD_RESET_INVALID,
                        ErrorCodes.VALIDATION_FAILED_TOKEN));

        if (reset.getUsedAt() != null) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_PASSWORD_RESET_TOKEN_USED,
                    ErrorCodes.VALIDATION_FAILED_TOKEN);
        }

        if (reset.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_PASSWORD_RESET_EXPIRED,
                    ErrorCodes.EXPIRED_TOKEN);
        }

        User user = userRepository.findById(reset.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        reset.setUsedAt(Instant.now());
        passwordResetRepository.save(reset);

        tokenService.revokeAllUserRefreshTokens(user.getUserId());
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String userSso) {
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.NOT_FOUND));
        return userMapper.toDto(user);
    }

    private LoginResponse buildLoginResponse(User user) {
        String accessToken = tokenService.generateAccessToken(user);
        String refreshToken = tokenService.generateRefreshToken(user);

        return new LoginResponse(accessToken, refreshToken);
    }

    private String generateUserSso() {
        return "USER_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateGoogleUserSso() {
        return "GOOGLE_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private Map<String, String> verifyAndGetMailFromGoogle(String idTokenString) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singleton(googleClientId))
                    .build();
            GoogleIdToken idToken = verifier.verify(idTokenString);

            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                if (email == null || email.isBlank()) {
                    throw new UnauthorizedException(MessageConstants.MESSAGE_GOOGLE_TOKEN_INVALID, ErrorCodes.UNAUTHORIZED);
                }
                String fullName = (String) payload.get("name");
                if (fullName == null || fullName.isBlank()) {
                    fullName = email;
                }

                return Map.of(
                        "email", email,
                        "fullName", fullName);
            } else {
                throw new UnauthorizedException(MessageConstants.MESSAGE_GOOGLE_TOKEN_INVALID, ErrorCodes.UNAUTHORIZED);
            }

        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            throw new UnauthorizedException(
                    MessageConstants.MESSAGE_GOOGLE_TOKEN_VERIFICATION_FAILED, ErrorCodes.UNAUTHORIZED);
        }
    }

    @Transactional
    public LoginResponse loginWithGoogle(String googleToken) {
        if (googleToken == null || googleToken.isBlank()) {
            throw new UnauthorizedException(
                    MessageConstants.MESSAGE_GOOGLE_TOKEN_INVALID,
                    ErrorCodes.UNAUTHORIZED);
        }

        Map<String, String> emailAndFullName = verifyAndGetMailFromGoogle(googleToken);
        String email = emailAndFullName.get("email");
        String fullName = emailAndFullName.get("fullName");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .userSso(generateGoogleUserSso())
                    .planType(SubcriptionType.FREE.toString())
                    .fullName(fullName)
                    .exp(0)
                    .level(1)
                    .metadata("{}")
                    .emailVerified(true)
                    .status(UserStatus.ACTIVE.toString())
                    .systemRole(SystemRole.USER)
                    .build();
            return userRepository.save(newUser);
        });

        checkValidUser(user);
        return buildLoginResponse(user);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_INVALID,
                    ErrorCodes.EMAIL_VERIFICATION_INVALID);
        }

        String hashedToken = tokenService.hashToken(rawToken);

        EmailVerification verification = emailVerificationRepository.findByVerificationCode(hashedToken)
                .orElseThrow(() -> new BadRequestException(
                        MessageConstants.MESSAGE_EMAIL_VERIFICATION_INVALID,
                        ErrorCodes.EMAIL_VERIFICATION_INVALID));

        ensureEmailVerificationAttemptsAllowed(verification);

        if (verification.getVerifiedAt() != null) {
            rejectEmailVerificationAttempt(
                    verification,
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_ALREADY_USED,
                    ErrorCodes.EMAIL_VERIFICATION_ALREADY_USED);
        }

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            rejectEmailVerificationAttempt(
                    verification,
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_EXPIRED,
                    ErrorCodes.EMAIL_VERIFICATION_ALREADY_USED);
        }

        User user = userRepository.findById(verification.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.NOT_FOUND));

        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE.toString());
        userRepository.save(user);

        verification.setVerifiedAt(Instant.now());
        emailVerificationRepository.save(verification);
    }

    private void ensureEmailVerificationAttemptsAllowed(EmailVerification verification) {
        if (emailVerificationAttempts(verification) >= 5) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS,
                    ErrorCodes.EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS);
        }
    }

    private void rejectEmailVerificationAttempt(
            EmailVerification verification,
            String message,
            String errorCode) {
        int attempts = emailVerificationAttempts(verification);
        verification.setAttempts(attempts + 1);
        emailVerificationRepository.save(verification);

        if (verification.getAttempts() >= 5) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS,
                    ErrorCodes.EMAIL_VERIFICATION_TOO_MANY_ATTEMPTS);
        }

        throw new BadRequestException(message, errorCode);
    }

    private static int emailVerificationAttempts(EmailVerification verification) {
        return verification.getAttempts() == null ? 0 : verification.getAttempts();
    }

    @Transactional
    public ApiResponse<String> changePasswordRequest(String oldPassword, String newPassword) {
        String userSsoOrNull = SecurityUtils.getCurrentUserSsoOrNull();
        if (userSsoOrNull == null || userSsoOrNull.isBlank()) {
            throw new UnauthorizedException(
                    MessageConstants.MESSAGE_LOGIN_INVALID_CREDENTIALS,
                    ErrorCodes.UNAUTHORIZED);
        }

        User user = userRepository.findByUserSso(userSsoOrNull)
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new BadRequestException(
                    MessageConstants.MESSAGE_USER_OLD_PASSWORD_INCORRECT,
                    ErrorCodes.INVALID);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        tokenService.revokeAllUserRefreshTokens(user.getUserId());

        return ApiResponse.ok(MessageConstants.MESSAGE_PASSWORD_CHANGE_SUCCESS);
    }

    @Transactional
    public void devVerifyAllUsers() {
        userRepository.findAll().forEach(user -> {
            user.setEmailVerified(true);
            user.setStatus(UserStatus.ACTIVE.toString());
            userRepository.save(user);
        });
    }

    private void checkValidUser(User user) {
        if (user == null) {
            throw new ResourceNotFoundException(
                    MessageConstants.MESSAGE_USER_NOT_FOUND,
                    ErrorCodes.USER_NOT_FOUND);
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new UnauthorizedException(
                    MessageConstants.MESSAGE_USER_EMAIL_INVALID,
                    ErrorCodes.UNAUTHORIZED);
        }

        if (!UserStatus.ACTIVE.toString().equals(user.getStatus())) {
            throw new UnauthorizedException(
                    MessageConstants.MESSAGE_USER_NOT_ACTIVATED,
                    ErrorCodes.USER_NOT_ACTIVATED);
        }
    }
}
