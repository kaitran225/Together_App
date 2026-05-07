package com.project.exe.auth.config;

import com.project.exe.common.entity.User;
import com.project.exe.common.exception.ResourceNotFoundException;
import com.project.exe.common.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailService implements UserDetailsService {
    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws ResourceNotFoundException {

        User user = userService.getUserByEmail(username);

        if (user == null){
            throw new ResourceNotFoundException("User not found with email: " + username, "USER_NOT_FOUND");
        }

        // mặc định user sẽ có role là USER
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

        // nếu user là admin thì thêm role ADMIN
        if(user.getIsAdmin() != null && user.getIsAdmin()){
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }

        // admin thì sẽ set isAdmin thành true khi kiểm tra ở login
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUserSso())
                .password(user.getPasswordHash())
                .authorities(authorities)
                .build();
        };
    }

