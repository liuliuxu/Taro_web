package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 审批流程定义
 * 节点 JSON: [{"index":0,"name":"部门主管审批","approverType":"role","approverValue":"manager"},...]
 * approverType: role(approverValue=角色) / org(approverValue=机构id) / user(approverValue=逗号分隔用户id)
 */
@Data
@Entity
@Table(name = "process_definitions")
public class ProcessDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** 关联表单定义 id */
    private Long formId;

    @Column(columnDefinition = "TEXT")
    private String nodesJson;

    @Column(length = 255)
    private String remark;

    @Column(length = 20)
    private String status = "draft";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}