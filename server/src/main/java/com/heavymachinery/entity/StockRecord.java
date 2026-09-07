package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 备件出入库流水
 */
@Data
@Entity
@Table(name = "stock_records")
public class StockRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long partId;
    @Column(length = 150)
    private String partName;

    /** in / out */
    @Column(length = 10)
    private String type;

    private BigDecimal qty;

    @Column(length = 30)
    private String unit;

    /** 关联单号（采购单号/出库单号） */
    @Column(length = 50)
    private String relateNo;

    private Long operatorId;
    @Column(length = 100)
    private String operatorName;

    private Long orgId;

    @Column(length = 500)
    private String remark;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}