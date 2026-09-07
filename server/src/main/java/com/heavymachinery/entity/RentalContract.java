package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 设备租赁合同实体
 * 生命周期: active(租赁中) -> returned(已归还) | cancelled(已取消)
 */
@Data
@Entity
@Table(name = "rental_contract")
public class RentalContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String contractNo;

    @Column(nullable = false)
    private Long machineryId;

    @Column(length = 100)
    private String machineryName;

    @Column(length = 50)
    private String machineryModel;

    @Column(length = 100)
    private String clientCompany;

    @Column(length = 50)
    private String clientContact;

    @Column(length = 20)
    private String clientPhone;

    /** 押金（元） */
    @Column(precision = 12, scale = 2)
    private BigDecimal deposit;

    /** 日租金（元/天） */
    @Column(precision = 12, scale = 2)
    private BigDecimal dailyRate;

    private LocalDate startDate;

    private LocalDate endDate;

    /** 承租天数 */
    private Integer rentDays;

    /** 应收总金额 */
    @Column(precision = 12, scale = 2)
    private BigDecimal totalAmount;

    /** active, returned, cancelled */
    @Column(nullable = false, length = 20)
    private String status = "active";

    private LocalDate actualReturnDate;

    @Column(columnDefinition = "TEXT")
    private String note;

    private Long createdByUserId;

    @Column(length = 50)
    private String createdByName;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}