package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建维修/保养工单请求
 */
@Data
public class WorkOrderCreateRequest {

    @NotNull(message = "请选择设备")
    private Long machineryId;

    @NotBlank(message = "请填写工单标题")
    private String title;

    private String description;

    /** repair 维修, maintain 保养 */
    @NotBlank(message = "请选择工单类型")
    private String type;

    /** low, medium, high, urgent */
    private String priority = "medium";
}
