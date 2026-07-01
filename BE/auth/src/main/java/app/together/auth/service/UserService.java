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

    public List<UserDto> getAllUserDtos() {
        return userRepository.findAll().stream()
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
