package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 审批表单选项集（下拉/多选字段的选项可自定义并可复用）
 */
@Data
@Entity
@Table(name = "option_sets")
public class OptionSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    /** 选项 JSON 数组: [{"label":"是","value":"true"}, ...] */
    @Column(columnDefinition = "TEXT")
    private String optionsJson;

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