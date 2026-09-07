package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 审批表单定义（动态表单）
 * 字段类型: input / textarea / number / date / select / multiple / upload / tree
 */
@Data
@Entity
@Table(name = "form_definitions")
public class FormDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** 审批对象类型: common / expense / workorder_cost / rental / purchase / disposal */
    @Column(nullable = false, length = 50)
    private String bizType;

    /** 字段 JSON 数组: [{"key":"title","label":"标题","type":"input","required":true,...}] */
    @Column(columnDefinition = "TEXT")
    private String fieldsJson;

    @Column(length = 255)
    private String remark;

    @Column(length = 20)
    private String status = "enabled";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}