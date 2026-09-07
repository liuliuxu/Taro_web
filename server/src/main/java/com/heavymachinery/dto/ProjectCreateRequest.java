package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 新建工程项目请求
 */
@Data
public class ProjectCreateRequest {

    @NotBlank
    private String name;

    private String customerName;
    private String customerPhone;
    private String address;
    private LocalDate plannedStart;
    private LocalDate plannedEnd;
    private BigDecimal budget;
    private String description;
    private String managerName;
}