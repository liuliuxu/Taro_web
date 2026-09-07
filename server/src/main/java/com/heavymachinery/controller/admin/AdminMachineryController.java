package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.MachineryRequest;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.service.MachineryService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 设备管理接口（PC 后台）
 */
@RestController
@RequestMapping("/api/admin/machinery")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMachineryController {

    private final MachineryService machineryService;

    public AdminMachineryController(MachineryService machineryService) {
        this.machineryService = machineryService;
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<MachineryVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ApiResponse.success(machineryService.list(page, pageSize, category, keyword, status, null));
    }

    @PostMapping
    public ApiResponse<MachineryVO> create(@Valid @RequestBody MachineryRequest request) {
        return ApiResponse.success("设备新增成功", machineryService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<MachineryVO> update(@PathVariable Long id,
                                           @Valid @RequestBody MachineryRequest request) {
        return ApiResponse.success("设备更新成功", machineryService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        machineryService.delete(id);
        return ApiResponse.success("设备已删除", null);
    }
}