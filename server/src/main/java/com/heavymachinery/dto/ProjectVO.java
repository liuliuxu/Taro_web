package com.heavymachinery.dto;

import com.heavymachinery.entity.Project;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProjectVO {

    private Long id;
    private String projectNo;
    private String name;
    private String customerName;
    private String customerPhone;
    private String address;
    private LocalDate plannedStart;
    private LocalDate plannedEnd;
    private BigDecimal budget;
    private String description;
    private String managerName;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProjectVO from(Project p) {
        ProjectVO vo = new ProjectVO();
        vo.setId(p.getId());
        vo.setProjectNo(p.getProjectNo());
        vo.setName(p.getName());
        vo.setCustomerName(p.getCustomerName());
        vo.setCustomerPhone(p.getCustomerPhone());
        vo.setAddress(p.getAddress());
        vo.setPlannedStart(p.getPlannedStart());
        vo.setPlannedEnd(p.getPlannedEnd());
        vo.setBudget(p.getBudget());
        vo.setDescription(p.getDescription());
        vo.setManagerName(p.getManagerName());
        vo.setStatus(p.getStatus());
        vo.setCreatedAt(p.getCreatedAt());
        vo.setUpdatedAt(p.getUpdatedAt());
        return vo;
    }
}