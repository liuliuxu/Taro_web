package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单实体
 */
@Data
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 32)
    private String orderNo;

    /** 关联的机器 */
    @Column(name = "machinery_id")
    private Long machineryId;

    @Column(name = "machinery_name", length = 100)
    private String machineryName;

    @Column(name = "user_id")
    private Long userId;

    /**
     * purchase 购买, rental 租赁
     */
    @Column(nullable = false, length = 20)
    private String type;

    /** 金额（万元） */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(length = 20)
    private String contactPhone;

    /**
     * pending 待处理, paid 已付款, shipped 已发货, completed 已完成, cancelled 已取消
     */
    @Column(nullable = false, length = 20)
    private String status = "pending";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
