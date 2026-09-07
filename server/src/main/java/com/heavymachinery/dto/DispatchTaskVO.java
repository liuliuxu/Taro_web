package com.heavymachinery.dto;

import com.heavymachinery.entity.DispatchTask;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DispatchTaskVO {

    private Long id;
    private String dispatchNo;
    private Long projectId;
    private String projectName;
    private Long machineryId;
    private String machineryName;
    private String machineryModel;
    private String title;
    private String description;
    private Long assigneeUserId;
    private String assigneeName;
    private LocalDateTime startAt;
    private LocalDateTime endAt;
    private String status;
    private Integer progress;
    private String handleNote;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DispatchTaskVO from(DispatchTask t) {
        DispatchTaskVO vo = new DispatchTaskVO();
        vo.setId(t.getId());
        vo.setDispatchNo(t.getDispatchNo());
        vo.setProjectId(t.getProjectId());
        vo.setProjectName(t.getProjectName());
        vo.setMachineryId(t.getMachineryId());
        vo.setMachineryName(t.getMachineryName());
        vo.setMachineryModel(t.getMachineryModel());
        vo.setTitle(t.getTitle());
        vo.setDescription(t.getDescription());
        vo.setAssigneeUserId(t.getAssigneeUserId());
        vo.setAssigneeName(t.getAssigneeName());
        vo.setStartAt(t.getStartAt());
        vo.setEndAt(t.getEndAt());
        vo.setStatus(t.getStatus());
        vo.setProgress(t.getProgress());
        vo.setHandleNote(t.getHandleNote());
        vo.setCreatedAt(t.getCreatedAt());
        vo.setUpdatedAt(t.getUpdatedAt());
        return vo;
    }
}