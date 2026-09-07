package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.dto.UserCreateRequest;
import com.heavymachinery.dto.UserUpdateRequest;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户管理接口（PC 后台）
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    public AdminUserController(UserRepository userRepository,
                               PasswordEncoder passwordEncoder,
                               AuthService authService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<User>> list(@RequestParam(required = false) String keyword,
                                        @RequestParam(required = false) String role) {
        List<User> list = userRepository.findAll().stream()
                .filter(u -> role == null || role.isEmpty() || role.equals(u.getRole()))
                .filter(u -> keyword == null || keyword.isEmpty()
                        || u.getUsername().contains(keyword)
                        || (u.getNickname() != null && u.getNickname().contains(keyword))
                        || (u.getPhone() != null && u.getPhone().contains(keyword)))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<User> create(@Valid @RequestBody UserCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException(400, "用户名已存在");
        }
        if (request.getPhone() != null && !request.getPhone().isEmpty()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(400, "手机号已被使用");
        }
        User u = new User();
        u.setUsername(request.getUsername());
        u.setPassword(passwordEncoder.encode(request.getPassword()));
        u.setNickname(request.getNickname());
        u.setPhone(request.getPhone());
        u.setEmail(request.getEmail());
        u.setRole(request.getRole());
        return ApiResponse.success("用户创建成功", userRepository.save(u));
    }

    @PutMapping("/{id}")
    public ApiResponse<User> update(@PathVariable Long id,
                                    @RequestBody UserUpdateRequest request) {
        User u = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        if (request.getNickname() != null) u.setNickname(request.getNickname());
        if (request.getPhone() != null) u.setPhone(request.getPhone());
        if (request.getEmail() != null) u.setEmail(request.getEmail());
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            if ("admin".equals(request.getRole()) && !"admin".equals(u.getRole())) {
                User current = authService.getCurrentUser();
                if (current.getId().equals(u.getId())) {
                    throw new BusinessException(400, "不能修改自己的角色");
                }
            }
            u.setRole(request.getRole());
        }
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            u.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return ApiResponse.success("用户更新成功", userRepository.save(u));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        User current = authService.getCurrentUser();
        if (current.getId().equals(id)) {
            throw new BusinessException(400, "不能删除当前登录账号");
        }
        User u = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "用户不存在"));
        if ("admin".equals(u.getRole())) {
            throw new BusinessException(400, "不能删除管理员账号");
        }
        userRepository.deleteById(id);
        return ApiResponse.success("用户已删除", null);
    }
}