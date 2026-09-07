package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 创建调度任务请求
 */
@Data
public class DispatchTaskCreateRequest {

    @NotNull
    private Long projectId;

    @NotNull
    private Long machineryId;

    @NotBlank
    private String title;

    private String description;
    private Long assigneeUserId;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
}