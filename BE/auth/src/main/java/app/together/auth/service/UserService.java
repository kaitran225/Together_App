package app.together.auth.service;

import app.together.common.auth.dto.UserDto;
import app.together.common.auth.entity.User;
import app.together.common.auth.mapper.UserMapper;
import app.together.common.auth.repository.UserRepository;
import app.together.common.shared.constant.ErrorCodes;
import app.together.common.shared.constant.MessageConstants;
import app.together.common.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;

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

    public UserDto getUserDtoBySso(String userSso) {
        User user = userRepository.findByUserSso(userSso)
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
        return userMapper.toDto(user);
    }

    public void updateUser(User user) {
        userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        MessageConstants.MESSAGE_USER_NOT_FOUND,
                        ErrorCodes.USER_NOT_FOUND));
        userRepository.save(user);
    }

}
