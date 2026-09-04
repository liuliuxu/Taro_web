package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 用户列表接口 - 供移动端选择工单处理人（企业内部成员）
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ApiResponse<List<User>> list() {
        return ApiResponse.success(userRepository.findAll());
    }
}
