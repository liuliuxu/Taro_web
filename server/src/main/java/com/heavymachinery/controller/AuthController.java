package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.dto.AuthResponse;
import com.heavymachinery.dto.LoginRequest;
import com.heavymachinery.dto.RegisterRequest;
import com.heavymachinery.entity.User;
import com.heavymachinery.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("登录成功", authService.login(request));
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("注册成功", authService.register(request));
    }

    @GetMapping("/profile")
    public ApiResponse<User> profile() {
        return ApiResponse.success(authService.getCurrentUser());
    }
}
