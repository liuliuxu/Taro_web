package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.dto.AuthResponse;
import com.heavymachinery.dto.LoginRequest;
import com.heavymachinery.dto.RegisterRequest;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.security.JwtUtil;
import com.heavymachinery.security.UserPrincipal;
import com.heavymachinery.service.AuthService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = userRepository.findById(principal.getId())
                    .orElseThrow(() -> new BusinessException("用户不存在"));
            String token = jwtUtil.generateToken(principal);
            return new AuthResponse(token, user);
        } catch (Exception e) {
            throw new BusinessException("账号或密码错误");
        }
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("账号已被占用");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("手机号已被注册");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone());
        user.setNickname(request.getUsername());
        user.setRole("customer");

        User saved = userRepository.save(user);

        // 注册成功后自动登录
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtUtil.generateToken(principal);
        return new AuthResponse(token, saved);
    }

    @Override
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BusinessException(401, "未登录");
        }
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }
}
