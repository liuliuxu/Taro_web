package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.dto.OrgVO;
import com.heavymachinery.entity.Org;
import com.heavymachinery.service.OrgService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 机构管理接口（PC 后台）
 */
@RestController
@RequestMapping("/api/admin/orgs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrgController {

    private final OrgService orgService;

    public AdminOrgController(OrgService orgService) {
        this.orgService = orgService;
    }

    @GetMapping("/tree")
    public ApiResponse<List<OrgVO>> tree() {
        return ApiResponse.success(orgService.tree());
    }

    @GetMapping("/list")
    public ApiResponse<List<Org>> list() {
        return ApiResponse.success(orgService.listAll());
    }

    @PostMapping
    public ApiResponse<OrgVO> create(@RequestBody Org org) {
        return ApiResponse.success("机构创建成功", orgService.create(org));
    }

    @PutMapping("/{id}")
    public ApiResponse<OrgVO> update(@PathVariable Long id, @RequestBody Org org) {
        return ApiResponse.success("机构更新成功", orgService.update(id, org));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        orgService.delete(id);
        return ApiResponse.success("机构已删除", null);
    }
}