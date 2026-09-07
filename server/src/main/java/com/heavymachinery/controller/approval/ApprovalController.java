package com.heavymachinery.controller.approval;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.dto.ApprovalSubmitRequest;
import com.heavymachinery.entity.ApprovalInstance;
import com.heavymachinery.service.ApprovalService;
import com.heavymachinery.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 审批中心（移动端 / 普通用户）：发起、待办、已办、我的申请
 */
@RestController
@RequestMapping("/api/approval")
public class ApprovalController {

    private final ApprovalService approvalService;
    private final AuthService authService;

    public ApprovalController(ApprovalService approvalService, AuthService authService) {
        this.approvalService = approvalService;
        this.authService = authService;
    }

    /** 可发起的流程 */
    @GetMapping("/startable")
    public ApiResponse<?> startable() {
        return ApiResponse.success(approvalService.listStartable());
    }

    /** 表单定义（移动端渲染动态表单用） */
    @GetMapping("/form")
    public ApiResponse<com.heavymachinery.entity.FormDefinition> form(@RequestParam Long id) {
        return ApiResponse.success(approvalService.getForm(id));
    }

    /** 选项集（下拉选项渲染用） */
    @GetMapping("/option-sets")
    public ApiResponse<?> optionSets() {
        return ApiResponse.success(approvalService.listOptionSets());
    }

    @PostMapping("/submit")
    public ApiResponse<ApprovalInstance> submit(@RequestBody ApprovalSubmitRequest request) {
        return ApiResponse.success("发起成功", approvalService.submit(request));
    }

    @GetMapping("/my-apps")
    public ApiResponse<?> myApps() {
        return ApiResponse.success(approvalService.listByApplicant());
    }

    @GetMapping("/todo")
    public ApiResponse<?> todo() {
        return ApiResponse.success(approvalService.listTodo());
    }

    @GetMapping("/detail")
    public ApiResponse<Map<String, Object>> detail(@RequestParam Long id) {
        return ApiResponse.success(approvalService.detail(id));
    }

    @PostMapping("/approve")
    public ApiResponse<ApprovalInstance> approve(@RequestParam Long id,
                                                 @RequestParam(required = false) String comment) {
        return ApiResponse.success("已通过", approvalService.approve(id, comment));
    }

    @PostMapping("/reject")
    public ApiResponse<ApprovalInstance> reject(@RequestParam Long id,
                                                @RequestParam(required = false) String comment) {
        return ApiResponse.success("已驳回", approvalService.reject(id, comment));
    }

    @PostMapping("/withdraw")
    public ApiResponse<ApprovalInstance> withdraw(@RequestParam Long id) {
        return ApiResponse.success("已撤回", approvalService.withdraw(id, authService.getCurrentUser().getId()));
    }
}