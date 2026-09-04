package com.heavymachinery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderCreateRequest {

    @NotNull(message = "请选择设备")
    private Long machineryId;

    /**
     * purchase 购买, rental 租赁
     */
    @NotNull(message = "请选择订单类型")
    private String type;

    private String contactPhone;
}
