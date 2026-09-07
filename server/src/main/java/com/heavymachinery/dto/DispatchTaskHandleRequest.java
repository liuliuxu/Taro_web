package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 调度任务状态流转请求（派发/开始/完成/取消/进度更新）
 */
@Data
public class DispatchTaskHandleRequest {

    /** assigned, ongoing, done, cancelled */
    @NotBlank
    private String status;

    private Long assigneeUserId;

    private Integer progress;

    private String handleNote;
}