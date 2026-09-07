package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 调度派单任务实体（工程下的设备作业任务）
 * 生命周期: created(待派发) -> assigned(已派发) -> ongoing(执行中)
 *           -> done(已完成) | cancelled(已取消)
 */
@Data
@Entity
@Table(name = "dispatch_task")
public class DispatchTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String dispatchNo;

    @Column(nullable = false)
    private Long projectId;

    @Column(length = 120)
    private String projectName;

    @Column(nullable = false)
    private Long machineryId;

    @Column(length = 100)
    private String machineryName;

    @Column(length = 50)
    private String machineryModel;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** 执行人（操作手/司机） */
    private Long assigneeUserId;

    @Column(length = 50)
    private String assigneeName;

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    /** created, assigned, ongoing, done, cancelled */
    @Column(nullable = false, length = 20)
    private String status = "created";

    /** 进度 0-100 */
    private Integer progress = 0;

    @Column(columnDefinition = "TEXT")
    private String handleNote;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}