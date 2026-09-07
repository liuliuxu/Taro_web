package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 审批实例
 */
@Data
@Entity
@Table(name = "approval_instances")
public class ApprovalInstance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 审批流水号 */
    @Column(nullable = false, length = 50)
    private String approvalNo;

    private Long processId;
    private Long formId;

    /** 审批对象类型 */
    @Column(length = 50)
    private String bizType;

    private Long bizId;

    @Column(nullable = false, length = 200)
    private String title;

    /** 表单数据 JSON */
    @Column(columnDefinition = "TEXT")
    private String formDataJson;

    /** pending / approved / rejected / withdrawn */
    @Column(length = 20)
    private String status = "pending";

    private Long applicantId;
    @Column(length = 100)
    private String applicantName;

    private Long orgId;

    /** 当前待处理节点下标 */
    private Integer currentNodeIndex;

    @Column(length = 100)
    private String currentNodeName;

    @Column(columnDefinition = "TEXT")
    private String remark;

    @Column(length = 200)
    private String resultNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime finishedAt;
}