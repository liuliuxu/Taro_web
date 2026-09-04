package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户管理接口（供 PC 后台管理系统使用）
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/list")
    public ApiResponse<List<User>> list() {
        return ApiResponse.success(userRepository.findAll());
    }

    @PutMapping("/{id}/role")
    public ApiResponse<User> updateRole(@PathVariable Long id, @RequestBody String role) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ApiResponse.error(404, "用户不存在");
        }
        user.setRole(role);
        return ApiResponse.success(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ApiResponse.success();
    }
}
