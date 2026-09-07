package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.dto.DispatchTaskCreateRequest;
import com.heavymachinery.dto.DispatchTaskHandleRequest;
import com.heavymachinery.dto.DispatchTaskVO;
import com.heavymachinery.entity.User;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.DispatchService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 调度派单接口（移动端：我的任务 / 工程任务 / 派发 / 执行）
 */
@RestController
@RequestMapping("/api/dispatch")
public class DispatchController {

    private final DispatchService dispatchService;
    private final AuthService authService;

    public DispatchController(DispatchService dispatchService, AuthService authService) {
        this.dispatchService = dispatchService;
        this.authService = authService;
    }

    @GetMapping("/my-tasks")
    public ApiResponse<List<DispatchTaskVO>> myTasks() {
        User current = authService.getCurrentUser();
        return ApiResponse.success(dispatchService.myTasks(current.getId()));
    }

    @GetMapping("/project/{projectId}")
    public ApiResponse<List<DispatchTaskVO>> listByProject(@PathVariable Long projectId) {
        return ApiResponse.success(dispatchService.listByProject(projectId));
    }

    @GetMapping("/list")
    public ApiResponse<List<DispatchTaskVO>> listAll(@RequestParam(required = false) String status) {
        return ApiResponse.success(dispatchService.listAll(status));
    }

    @GetMapping("/{id}")
    public ApiResponse<DispatchTaskVO> detail(@PathVariable Long id) {
        return ApiResponse.success(dispatchService.getDetail(id));
    }

    @PostMapping
    public ApiResponse<DispatchTaskVO> create(@Valid @RequestBody DispatchTaskCreateRequest request) {
        User current = authService.getCurrentUser();
        return ApiResponse.success("派单成功", dispatchService.create(request, current.getId()));
    }

    @PostMapping("/{id}/assign")
    public ApiResponse<DispatchTaskVO> assign(@PathVariable Long id,
                                              @RequestBody Map<String, Object> body) {
        Object v = body.get("assigneeUserId");
        Long assigneeUserId = v instanceof Number ? ((Number) v).longValue() : Long.valueOf(String.valueOf(v));
        return ApiResponse.success(dispatchService.assign(id, assigneeUserId));
    }

    @PostMapping("/{id}/handle")
    public ApiResponse<DispatchTaskVO> handle(@PathVariable Long id,
                                              @Valid @RequestBody DispatchTaskHandleRequest request) {
        return ApiResponse.success(dispatchService.handle(id, request));
    }
}