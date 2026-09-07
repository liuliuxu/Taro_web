package com.heavymachinery.dto;

import lombok.Data;

/**
 * PC 后台用户信息更新请求
 */
@Data
public class UserUpdateRequest {

    private String nickname;
    private String phone;
    private String email;
    private String role;
    private String password;
}