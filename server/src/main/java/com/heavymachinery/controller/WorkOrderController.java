package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.WorkOrderAssignRequest;
import com.heavymachinery.dto.WorkOrderCreateRequest;
import com.heavymachinery.dto.WorkOrderHandleRequest;
import com.heavymachinery.dto.WorkOrderVO;
import com.heavymachinery.service.WorkOrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 工单接口 - 企业内部移动端（报修/我的/处理/统计）
 */
@RestController
@RequestMapping("/api/workorders")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    public WorkOrderController(WorkOrderService workOrderService) {
        this.workOrderService = workOrderService;
    }

    @PostMapping
    public ApiResponse<WorkOrderVO> create(@Valid @RequestBody WorkOrderCreateRequest request) {
        return ApiResponse.success("报修/上报成功", workOrderService.create(request));
    }

    @GetMapping("/my-reported")
    public ApiResponse<List<WorkOrderVO>> myReported() {
        return ApiResponse.success(workOrderService.listByReporter());
    }

    @GetMapping("/my-assigned")
    public ApiResponse<List<WorkOrderVO>> myAssigned() {
        return ApiResponse.success(workOrderService.listMyAssigned());
    }

    @GetMapping("/my-todos")
    public ApiResponse<List<WorkOrderVO>> myTodos() {
        return ApiResponse.success(workOrderService.listMyTodos());
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<WorkOrderVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(workOrderService.list(page, pageSize, status, keyword));
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

    @GetMapping("/stats")
    public ApiResponse<Map<String, Long>> stats() {
        return ApiResponse.success(workOrderService.stats());
    }

    @GetMapping("/{id}")
    public ApiResponse<WorkOrderVO> detail(@PathVariable Long id) {
        return ApiResponse.success(workOrderService.getDetail(id));
    }
}
