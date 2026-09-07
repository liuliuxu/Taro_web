package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 采购申请单
 */
@Data
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String orderNo;

    private Long supplierId;
    @Column(length = 150)
    private String supplierName;

    @Column(nullable = false, length = 150)
    private String itemName;

    private BigDecimal quantity;

    @Column(length = 30)
    private String unit;

    private BigDecimal unitPrice;

    private BigDecimal totalAmount;

    /** pending / approved / rejected / paid / received / cancelled */
    @Column(length = 20)
    private String status = "pending";

    private Long applicantId;
    @Column(length = 100)
    private String applicantName;

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