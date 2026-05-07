package com.project.exe.common.service;

import com.project.exe.common.entity.User;
import com.project.exe.common.exception.ResourceNotFoundException;
import com.project.exe.common.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User getUserByEmail(String email){
        return userRepository.findByEmail(email).orElseThrow(
                () -> new ResourceNotFoundException("User not found with email: " + email, "USER_NOT_FOUND"));
    }

    public User getUserById(Long id){
        return userRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("User not found with id: " + id, "USER_NOT_FOUND"));
    }

    public User getUserBySso(String sso){
        return userRepository.findByUserSso(sso).orElseThrow(
                () -> new ResourceNotFoundException("User not found with sso: " + sso, "USER_NOT_FOUND"));
    }

    public void updateUser(User user){

        User existingUser = userRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + user.getEmail(), "USER_NOT_FOUND"));



        userRepository.save(user);
    }

    public void deleteUser(User user){
        userRepository.delete(user);
    }
}
