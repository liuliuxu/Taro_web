package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 维修/保养工单实体
 * 生命周期: created(待派单) -> assigned(待处理) -> processing(处理中)
 *           -> review(待验收) -> done(已完成) | cancelled(已取消)
 */
@Data
@Entity
@Table(name = "work_order")
public class WorkOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 工单号 */
    @Column(nullable = false, unique = true, length = 40)
    private String workNo;

    @Column(nullable = false)
    private Long machineryId;

    /** 冗余设备名称，便于列表展示 */
    @Column(length = 100)
    private String machineryName;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** repair 维修, maintain 保养 */
    @Column(nullable = false, length = 20)
    private String type = "repair";

    /** low, medium, high, urgent */
    @Column(length = 20)
    private String priority = "medium";

    /** created, assigned, processing, review, done, cancelled */
    @Column(nullable = false, length = 20)
    private String status = "created";

    /** 报修人 */
    @Column(nullable = false)
    private Long reportUserId;

    @Column(length = 50)
    private String reportUserName;

    /** 处理人 / 指派人 */
    private Long assigneeUserId;

    @Column(length = 50)
    private String assigneeName;

    /** 处理结果 / 维修说明 */
    @Column(columnDefinition = "TEXT")
    private String handleNote;

    /** 费用（元） */
    @Column(precision = 12, scale = 2)
    private BigDecimal cost;

    private LocalDateTime reportedAt;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
