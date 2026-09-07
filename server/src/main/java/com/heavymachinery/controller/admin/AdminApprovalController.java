package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.FormDefinition;
import com.heavymachinery.entity.OptionSet;
import com.heavymachinery.entity.ProcessDefinition;
import com.heavymachinery.service.ApprovalService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 审批配置管理（PC 后台）：选项集 / 动态表单 / 流程定义
 */
@RestController
@RequestMapping("/api/admin/approval")
@PreAuthorize("hasRole('ADMIN')")
public class AdminApprovalController {

    private final ApprovalService approvalService;

    public AdminApprovalController(ApprovalService approvalService) {
        this.approvalService = approvalService;
    }

    /* ===== 选项集 ===== */

    @GetMapping("/option-sets")
    public ApiResponse<?> listOptionSets() {
        return ApiResponse.success(approvalService.listOptionSets());
    }

    @PostMapping("/option-sets")
    public ApiResponse<?> saveOptionSet(@RequestBody OptionSet optionSet) {
        return ApiResponse.success("保存成功", approvalService.saveOptionSet(optionSet));
    }

    @DeleteMapping("/option-sets/{id}")
    public ApiResponse<?> deleteOptionSet(@PathVariable Long id) {
        approvalService.deleteOptionSet(id);
        return ApiResponse.success("删除成功", null);
    }

    /* ===== 表单 ===== */

    @GetMapping("/forms")
    public ApiResponse<?> listForms() {
        return ApiResponse.success(approvalService.listForms());
    }

    @PostMapping("/forms")
    public ApiResponse<?> saveForm(@RequestBody FormDefinition form) {
        return ApiResponse.success("保存成功", approvalService.saveForm(form));
    }

    @DeleteMapping("/forms/{id}")
    public ApiResponse<?> deleteForm(@PathVariable Long id) {
        approvalService.deleteForm(id);
        return ApiResponse.success("删除成功", null);
    }

    /* ===== 流程 ===== */

    @GetMapping("/processes")
    public ApiResponse<?> listProcesses() {
        return ApiResponse.success(approvalService.listProcesses());
    }

    @PostMapping("/processes")
    public ApiResponse<?> saveProcess(@RequestBody ProcessDefinition process) {
        return ApiResponse.success("保存成功", approvalService.saveProcess(process));
    }

    @PostMapping("/processes/{id}/publish")
    public ApiResponse<?> publishProcess(@PathVariable Long id) {
        ProcessDefinition p = approvalService.listProcesses().stream()
                .filter(x -> x.getId().equals(id)).findFirst().orElse(null);
        if (p == null) return ApiResponse.error(404, "流程不存在");
        p.setStatus("published");
        return ApiResponse.success("发布成功", approvalService.saveProcess(p));
    }

    @PostMapping("/processes/{id}/unpublish")
    public ApiResponse<?> unpublishProcess(@PathVariable Long id) {
        ProcessDefinition p = approvalService.listProcesses().stream()
                .filter(x -> x.getId().equals(id)).findFirst().orElse(null);
        if (p == null) return ApiResponse.error(404, "流程不存在");
        p.setStatus("draft");
        return ApiResponse.success("已下线", approvalService.saveProcess(p));
    }

    @DeleteMapping("/processes/{id}")
    public ApiResponse<?> deleteProcess(@PathVariable Long id) {
        approvalService.deleteProcess(id);
        return ApiResponse.success("删除成功", null);
    }

    /* ===== 审批实例（全部） ===== */

    @GetMapping("/instances")
    public ApiResponse<?> instances(@RequestParam(required = false) Integer page,
                                    @RequestParam(required = false) Integer pageSize,
                                    @RequestParam(required = false) String status,
                                    @RequestParam(required = false) String keyword) {
        return ApiResponse.success(approvalService.listAll(page, pageSize, status, keyword));
    }

    @GetMapping("/instances/{id}")
    public ApiResponse<Map<String, Object>> instanceDetail(@PathVariable Long id) {
        return ApiResponse.success(approvalService.detail(id));
    }
}