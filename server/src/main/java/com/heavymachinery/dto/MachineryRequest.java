package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 设备新增/编辑请求（PC 后台）
 */
@Data
public class MachineryRequest {

    @NotBlank
    private String name;

    private String model;
    private String category;
    private String brand;
    private String description;

    @NotNull
    private BigDecimal price;

    private Integer stock;
    private String status;
    private String image;
    private String specWeight;
    private String specPower;
    private String specDimensions;
    private String specCapacity;
    private Boolean recommended;
}