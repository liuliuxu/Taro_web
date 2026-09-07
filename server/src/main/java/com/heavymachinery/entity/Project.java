package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 工程项目实体
 * 生命周期: created(立项) -> active(进行中) -> finished(已完工) | cancelled(已取消)
 */
@Data
@Entity
@Table(name = "project")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 所属机构（数据隔离） */
    private Long orgId;

    @Column(nullable = false, unique = true, length = 40)
    private String projectNo;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 100)
    private String customerName;

    @Column(length = 20)
    private String customerPhone;

    @Column(length = 255)
    private String address;

    private LocalDate plannedStart;

    private LocalDate plannedEnd;

    /** 预算（万元） */
    @Column(precision = 12, scale = 2)
    private BigDecimal budget;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String managerName;

    /** created, active, finished, cancelled */
    @Column(nullable = false, length = 20)
    private String status = "created";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}