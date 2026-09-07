package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 客户/合同
 */
@Data
@Entity
@Table(name = "contracts")
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String contractNo;

    @Column(nullable = false, length = 150)
    private String customerName;

    @Column(length = 50)
    private String contact;

    @Column(length = 50)
    private String phone;

    /** 租赁 / 购买 / 服务 */
    @Column(length = 30)
    private String type;

    private BigDecimal amount;

    private LocalDate startDate;

    private LocalDate endDate;

    /** draft / active / finished / cancelled */
    @Column(length = 20)
    private String status = "draft";

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