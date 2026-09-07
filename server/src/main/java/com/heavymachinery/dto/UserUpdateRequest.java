package com.heavymachinery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    private Long orgId;
    private LocalDate hireDate;
    private Integer workYears;
    private BigDecimal annualLeave;
    private BigDecimal compensatoryLeave;
    private BigDecimal overtime;
}
