package com.heavymachinery.dto;

import lombok.Data;

import java.util.Map;

/**
 * 发起审批请求
 */
@Data
public class ApprovalSubmitRequest {

    private Long processId;

    /** 业务对象类型，审批通过后可回调业务 */
    private String bizType;

    private Long bizId;

    private String title;

    /** 表单数据：字段 key -> 值 */
    private Map<String, Object> formData;
}