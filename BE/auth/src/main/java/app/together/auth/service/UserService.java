package app.together.auth.service;

import app.together.common.auth.dto.UpdateUserRequest;
import app.together.common.auth.dto.UserDto;
import app.together.common.auth.dto.UserMetadata;
import app.together.common.auth.entity.User;
import app.together.common.auth.mapper.UserMapper;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.constant.ErrorCodes;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.ResourceNotFoundException;
import app.together.common.workflow.enums.UserStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper;

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email).orElseThrow(
                () -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
    }

    public User getUserById(Long id) {
        return userRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
    }

    public User getUserBySso(String sso) {
        return userRepository.findByUserSso(sso).orElseThrow(
                () -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
    }

    private UserMetadata parseMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return new UserMetadata(List.of(), List.of());
        }
        try {
            return objectMapper.readValue(metadataJson, UserMetadata.class);
        } catch (Exception e) {
            return new UserMetadata(List.of(), List.of());
        }
    }

    private String serializeMetadata(UserMetadata metadata) {
        try {
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            return "{}";
        }
    }

    private UserDto enrichUserDto(User user) {
        UserDto dto = userMapper.toDto(user);
        UserMetadata metadata = parseMetadata(user.getMetadata());
        return new UserDto(
                dto.createdAt(),
                dto.createdBy(),
                dto.updatedAt(),
                dto.updatedBy(),
                dto.userId(),
                dto.userSso(),
                dto.email(),
                dto.fullName(),
                dto.avatarUrl(),
                dto.planType(),
                dto.planExpiresAt(),
                dto.exp(),
                dto.level(),
                dto.streak(),
                dto.longestStreak(),
                dto.lastActiveDate(),
                dto.status(),
                dto.emailVerified(),
                dto.systemRole(),
                dto.isAdmin(),
                metadata.skills(),
                metadata.learningGoals()
        );
    }

    public UserDto getUserDtoBySso(String userSso) {
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
        return enrichUserDto(user);
    }

    @Transactional
    public void checkAndIncrementLoginStreak(String userSso) {
        User user = userRepository.findByUserSso(userSso).orElse(null);
        if (user == null) return;
        
        // Cập nhật streak khi đăng nhập / truy cập lần đầu trong ngày
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate lastActive = user.getLastActiveDate();
        if (lastActive == null || !lastActive.equals(today)) {
            int currentStreak = user.getStreak() != null ? user.getStreak() : 0;
            int longestStreak = user.getLongestStreak() != null ? user.getLongestStreak() : 0;
            int exp = user.getExp() != null ? user.getExp() : 0;

            if (lastActive == null) {
                currentStreak = 1;
            } else if (lastActive.equals(today.minusDays(1))) {
                currentStreak++;
                exp += 10 * currentStreak; // STREAK_BONUS_EXP
            } else {
                currentStreak = 1;
            }

            if (currentStreak > longestStreak) {
                longestStreak = currentStreak;
            }

            user.setStreak(currentStreak);
            user.setLongestStreak(longestStreak);
            user.setLastActiveDate(today);
            user.setExp(exp);
            userRepository.save(user);
        }
    }

    public List<UserDto> getAllUserDtos() {
        return userRepository.findAll().stream()
                .map(this::enrichUserDto)
                .collect(Collectors.toList());
    }

    public List<UserDto> getUserDtosBySsoList(List<String> userSsoList) {
        if (userSsoList == null || userSsoList.isEmpty()) {
            return List.of();
        }
        return userSsoList.stream()
                .distinct()
                .map(sso -> userRepository.findByUserSso(sso).orElse(null))
                .filter(java.util.Objects::nonNull)
                .map(this::enrichUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateProfile(String userSso, UpdateUserRequest request) {
        User user = getUserBySso(userSso);

        if (request.fullName() != null) {
            user.setFullName(request.fullName());
        }

        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        if (request.skills() != null || request.learningGoals() != null) {
            UserMetadata currentMetadata = parseMetadata(user.getMetadata());
            List<String> newSkills = request.skills() != null ? request.skills() : currentMetadata.skills();
            List<String> newGoals = request.learningGoals() != null ? request.learningGoals() : currentMetadata.learningGoals();
            UserMetadata newMetadata = new UserMetadata(newSkills, newGoals);
            user.setMetadata(serializeMetadata(newMetadata));
        }

        User updatedUser = userRepository.save(user);
        return enrichUserDto(updatedUser);
    }

    @Transactional
    public UserDto toggleUserStatus(Long userId) {
        User user = getUserById(userId);
        user.setStatus(!user.getStatus().equalsIgnoreCase(UserStatus.ACTIVE.name()) ? UserStatus.ACTIVE.name() : UserStatus.INACTIVE.name());
        User updatedUser = userRepository.save(user);
        return enrichUserDto(updatedUser);
    }

    public void updateUser(User user) {
        userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
        userRepository.save(user);
    }

}
