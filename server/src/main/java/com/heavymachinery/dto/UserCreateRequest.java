package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * PC 后台新建用户请求
 */
@Data
public class UserCreateRequest {

    @NotBlank
    private String username;

    @NotBlank
    private String password;

    private String nickname;
    private String phone;
    private String email;

    /** admin, manager, operator, customer */
    @NotBlank
    private String role;

    /** 所属机构；为空时默认为当前操作人机构 */
    private Long orgId;
}