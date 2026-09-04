package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.service.MachineryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 设备接口（移动端列表、详情等公开接口）
 */
@RestController
@RequestMapping("/api/machinery")
public class MachineryController {

    private final MachineryService machineryService;

    public MachineryController(MachineryService machineryService) {
        this.machineryService = machineryService;
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<MachineryVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        return ApiResponse.success(machineryService.list(page, pageSize, category, keyword, status));
    }

    @GetMapping("/categories")
    public ApiResponse<List<String>> categories() {
        return ApiResponse.success(machineryService.listCategories());
    }

    @GetMapping("/recommendations")
    public ApiResponse<List<MachineryVO>> recommendations() {
        return ApiResponse.success(machineryService.listRecommended());
    }

    @GetMapping("/{id}")
    public ApiResponse<MachineryVO> detail(@PathVariable Long id) {
        return ApiResponse.success(machineryService.getDetail(id));
    }
}
