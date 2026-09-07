package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 设备巡检/保养计划
 */
@Data
@Entity
@Table(name = "inspection_plans")
public class InspectionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long machineryId;
    @Column(length = 150)
    private String machineryName;

    /** inspection / maintenance */
    @Column(length = 30)
    private String type;

    @Column(length = 500)
    private String content;

    private Integer cycleDays;

    private LocalDate lastDoneAt;

    private LocalDate nextDueAt;

    private Long assigneeId;
    @Column(length = 100)
    private String assigneeName;

    /** created / done */
    @Column(length = 20)
    private String status = "created";

    private Long orgId;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}