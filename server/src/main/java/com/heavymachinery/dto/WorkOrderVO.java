package com.heavymachinery.dto;

import com.heavymachinery.entity.WorkOrder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class WorkOrderVO {

    private Long id;
    private String workNo;
    private Long machineryId;
    private String machineryName;
    private String title;
    private String description;
    private String type;
    private String priority;
    private String status;
    private Long reportUserId;
    private String reportUserName;
    private Long assigneeUserId;
    private String assigneeName;
    private String handleNote;
    private BigDecimal cost;
    private LocalDateTime reportedAt;
    private LocalDateTime assignedAt;
    private LocalDateTime completedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String machineryModel;
    private String machineryCategory;

    public static WorkOrderVO from(WorkOrder o) {
        WorkOrderVO vo = new WorkOrderVO();
        vo.setId(o.getId());
        vo.setWorkNo(o.getWorkNo());
        vo.setMachineryId(o.getMachineryId());
        vo.setMachineryName(o.getMachineryName());
        vo.setTitle(o.getTitle());
        vo.setDescription(o.getDescription());
        vo.setType(o.getType());
        vo.setPriority(o.getPriority());
        vo.setStatus(o.getStatus());
        vo.setReportUserId(o.getReportUserId());
        vo.setReportUserName(o.getReportUserName());
        vo.setAssigneeUserId(o.getAssigneeUserId());
        vo.setAssigneeName(o.getAssigneeName());
        vo.setHandleNote(o.getHandleNote());
        vo.setCost(o.getCost());
        vo.setReportedAt(o.getReportedAt());
        vo.setAssignedAt(o.getAssignedAt());
        vo.setCompletedAt(o.getCompletedAt());
        vo.setCreatedAt(o.getCreatedAt());
        vo.setUpdatedAt(o.getUpdatedAt());
        return vo;
    }
}
