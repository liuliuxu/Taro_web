package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 机械设备实体
 */
@Data
@Entity
@Table(name = "machinery")
public class Machinery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 所属机构（数据隔离） */
    private Long orgId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String model;

    @Column(length = 50)
    private String category;

    @Column(length = 100)
    private String brand;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    /** 价格（万元） */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock = 0;

    /**
     * available 可购买, rented 已租赁, maintenance 维护中
     */
    @Column(length = 20)
    private String status = "available";

    @Column(length = 255)
    private String image;

    /** 整机重量 */
    @Column(length = 50)
    private String specWeight;

    /** 额定功率 */
    @Column(length = 50)
    private String specPower;

    /** 外形尺寸 */
    @Column(length = 100)
    private String specDimensions;

    /** 工作容量 */
    @Column(length = 50)
    private String specCapacity;

    /** 是否推荐 */
    @Column(name = "is_recommended")
    private Boolean recommended = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
