package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.ProjectRepository;
import com.heavymachinery.service.DispatchService;
import com.heavymachinery.service.RentalService;
import com.heavymachinery.service.WorkOrderService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * PC 后台仪表盘统计接口
 */
@RestController
@RequestMapping("/api/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final MachineryRepository machineryRepository;
    private final ProjectRepository projectRepository;
    private final WorkOrderService workOrderService;
    private final DispatchService dispatchService;
    private final RentalService rentalService;

    public AdminStatsController(MachineryRepository machineryRepository,
                                ProjectRepository projectRepository,
                                WorkOrderService workOrderService,
                                DispatchService dispatchService,
                                RentalService rentalService) {
        this.machineryRepository = machineryRepository;
        this.projectRepository = projectRepository;
        this.workOrderService = workOrderService;
        this.dispatchService = dispatchService;
        this.rentalService = rentalService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        Map<String, Object> result = new LinkedHashMap<>();

        // 设备统计
        Map<String, Long> devices = new LinkedHashMap<>();
        List<Machinery> all = machineryRepository.findAll();
        devices.put("total", (long) all.size());
        devices.put("available", all.stream().filter(m -> "available".equals(m.getStatus())).count());
        devices.put("rented", all.stream().filter(m -> "rented".equals(m.getStatus())).count());
        devices.put("maintenance", all.stream().filter(m -> "maintenance".equals(m.getStatus())).count());
        result.put("devices", devices);

        // 设备分类分布
        Map<String, Long> categories = new LinkedHashMap<>();
        all.stream().filter(m -> m.getCategory() != null)
                .collect(Collectors.groupingBy(Machinery::getCategory, Collectors.counting()))
                .forEach((k, v) -> categories.put(k, v));
        result.put("deviceCategories", categories);

        // 工程统计
        Map<String, Long> projects = new LinkedHashMap<>();
        projects.put("total", projectRepository.count());
        projects.put("created", projectRepository.countByStatus("created"));
        projects.put("active", projectRepository.countByStatus("active"));
        projects.put("finished", projectRepository.countByStatus("finished"));
        result.put("projects", projects);

        // 工单 / 派单 / 租赁
        result.put("workOrders", workOrderService.stats());
        result.put("dispatch", dispatchService.stats());
        result.put("rentals", rentalService.stats());

        // 设备预警：维修中设备
        result.put("maintenanceDevices", all.stream()
                .filter(m -> "maintenance".equals(m.getStatus()))
                .map(MachineryVO::from)
                .limit(5).collect(Collectors.toList()));

        return ApiResponse.success(result);
    }
}