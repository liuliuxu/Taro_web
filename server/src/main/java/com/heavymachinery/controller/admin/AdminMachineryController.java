package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.repository.MachineryRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 设备管理接口（供 PC 后台管理系统使用）
 */
@RestController
@RequestMapping("/api/admin/machinery")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMachineryController {

    private final MachineryRepository machineryRepository;

    public AdminMachineryController(MachineryRepository machineryRepository) {
        this.machineryRepository = machineryRepository;
    }

    @GetMapping("/list")
    public ApiResponse<List<Machinery>> list() {
        return ApiResponse.success(machineryRepository.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<Machinery> get(@PathVariable Long id) {
        return ApiResponse.success(machineryRepository.findById(id).orElse(null));
    }

    @PostMapping
    public ApiResponse<Machinery> create(@RequestBody Machinery machinery) {
        if (machinery.getId() != null) {
            machinery.setId(null);
        }
        return ApiResponse.success("创建成功", machineryRepository.save(machinery));
    }

    @PutMapping("/{id}")
    public ApiResponse<Machinery> update(@PathVariable Long id, @RequestBody Machinery machinery) {
        machinery.setId(id);
        return ApiResponse.success("更新成功", machineryRepository.save(machinery));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        machineryRepository.deleteById(id);
        return ApiResponse.success();
    }
}
