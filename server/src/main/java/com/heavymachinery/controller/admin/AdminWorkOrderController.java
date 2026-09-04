package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.WorkOrderAssignRequest;
import com.heavymachinery.dto.WorkOrderHandleRequest;
import com.heavymachinery.dto.WorkOrderVO;
import com.heavymachinery.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 工单管理接口（供 PC 后台管理系统使用）
 */
@RestController
@RequestMapping("/api/admin/workorders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWorkOrderController {

    private final WorkOrderService workOrderService;

    public AdminWorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<WorkOrderVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long assigneeUserId) {
        return ApiResponse.success(workOrderService.adminList(page, pageSize, status, keyword, assigneeUserId));
    }

    @GetMapping("/stats")
    public ApiResponse<?> stats() {
        return ApiResponse.success(workOrderService.stats());
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<WorkOrderVO> assign(@PathVariable Long id,
                                           @Valid @RequestBody WorkOrderAssignRequest request) {
        return ApiResponse.success("派单成功", workOrderService.assign(id, request));
    }

    @PostMapping("/{id}/handle")
    public ApiResponse<WorkOrderVO> handle(@PathVariable Long id,
                                           @Valid @RequestBody WorkOrderHandleRequest request) {
        return ApiResponse.success("处理成功", workOrderService.handle(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<WorkOrderVO> detail(@PathVariable Long id) {
        return ApiResponse.success(workOrderService.getDetail(id));
    }
}
