package com.project.exe.workflow.controller;

import com.project.exe.common.dto.ApiResponse;
import com.project.exe.common.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @PutMapping("/me/{id}")
    public ApiResponse<ResponseEntity<String>> updateUser(@PathVariable String id, @RequestBody User user) {
        return ApiResponse.ok(ResponseEntity.ok("success"));
    }

    @DeleteMapping("/me/{id}")
    public ApiResponse<ResponseEntity<String>> deleteUser(@PathVariable String id) {

        return ApiResponse.ok(ResponseEntity.ok("success"));
    }
}
