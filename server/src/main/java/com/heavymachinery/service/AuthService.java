package com.heavymachinery.service;

import com.heavymachinery.dto.AuthResponse;
import com.heavymachinery.dto.LoginRequest;
import com.heavymachinery.dto.RegisterRequest;
import com.heavymachinery.entity.User;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    User getCurrentUser();
}
