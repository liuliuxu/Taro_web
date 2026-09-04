package com.heavymachinery.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 派单请求（指定处理人并进入下一步状态）
 */
@Data
public class WorkOrderAssignRequest {

    /** 处理人用户ID */
    @NotNull(message = "请选择处理人")
    private Long assigneeUserId;

    /** 派单后直接进入的状态: assigned / processing / review */
    private String status = "assigned";

    private String handleNote;
}
