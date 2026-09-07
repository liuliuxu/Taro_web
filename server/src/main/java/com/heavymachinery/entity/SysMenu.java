package com.heavymachinery.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 系统菜单管理
 * type: parent 分组 / item 页面菜单
 */
@Data
@Entity
@Table(name = "sys_menus")
public class SysMenu {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** parent 分组 / item 页面菜单 */
    @Column(nullable = false, length = 20)
    private String type = "item";

    /** 分组或菜单名称 */
    @Column(nullable = false, length = 100)
    private String name;

    /** 菜单路径（页面菜单必填），如 /devices */
    @Column(length = 200)
    private String path;

    /** 图标名称 */
    @Column(length = 100)
    private String icon;

    /** 所属分组ID（item 有效），parent 时为 null */
    private Long parentId;

    /** 排序值，越小越靠前 */
    private Integer sort = 0;

    /** 是否启用 */
    private Boolean enabled = true;

    /** 是否页面缓存（多页签开启时生效） */
    private Boolean cached = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}