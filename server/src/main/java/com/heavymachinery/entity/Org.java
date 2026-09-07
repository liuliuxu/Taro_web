package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 组织机构实体（多级树：集团→公司→部门/车队）
 */
@Data
@Entity
@Table(name = "orgs")
public class Org {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    private Long parentId;

    /** 机构全路径，如 /1/4/ ，用于快速查询子孙机构 */
    @Column(length = 500)
    private String path;

    /** 层级：0=集团 1=公司 2=部门/车队 */
    private Integer orgLevel = 0;

    private Long managerId;

    @Column(length = 50)
    private String managerName;

    @Column(length = 255)
    private String remark;

    @Column(length = 20)
    private String status = "enabled";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}