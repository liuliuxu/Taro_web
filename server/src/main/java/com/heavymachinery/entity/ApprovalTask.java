package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * 审批任务（流程节点实例）
 */
@Data
@Entity
@Table(name = "approval_tasks")
public class ApprovalTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long instanceId;

    private Integer nodeIndex;

    @Column(length = 100)
    private String nodeName;

    /** pending / approved / rejected */
    @Column(length = 20)
    private String status = "pending";

    /** 候选人用户id JSON 数组 */
    @Column(columnDefinition = "TEXT")
    private String candidateIdsJson;

    private Long handledById;
    @Column(length = 100)
    private String handledByName;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private LocalDateTime handledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}