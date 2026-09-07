package com.heavymachinery.dto;

import com.heavymachinery.entity.Org;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class OrgVO {

    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private String path;
    private Integer orgLevel;
    private Long managerId;
    private String managerName;
    private String remark;
    private String status;
    private LocalDateTime createdAt;
    private List<OrgVO> children = new ArrayList<>();

    public static OrgVO from(Org o) {
        OrgVO vo = new OrgVO();
        vo.setId(o.getId());
        vo.setCode(o.getCode());
        vo.setName(o.getName());
        vo.setParentId(o.getParentId());
        vo.setPath(o.getPath());
        vo.setOrgLevel(o.getOrgLevel());
        vo.setManagerId(o.getManagerId());
        vo.setManagerName(o.getManagerName());
        vo.setRemark(o.getRemark());
        vo.setStatus(o.getStatus());
        vo.setCreatedAt(o.getCreatedAt());
        return vo;
    }
}