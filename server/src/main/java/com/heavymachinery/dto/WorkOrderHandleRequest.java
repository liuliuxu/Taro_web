package com.heavymachinery.dto;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 处理工单请求（更新处理结果 / 流转状态）
 */
@Data
public class WorkOrderHandleRequest {

    /** 目标状态（只允许合法流转） */
    private String status;

    /** 处理结果 / 维修说明 */
    private String handleNote;

    /** 费用（元，可选） */
    private BigDecimal cost;
}
