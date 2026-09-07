package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.repository.ContractRepository;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.PurchaseOrderRepository;
import com.heavymachinery.repository.RentalContractRepository;
import com.heavymachinery.repository.SparePartRepository;
import com.heavymachinery.repository.ProjectRepository;
import com.heavymachinery.service.DispatchService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.service.RentalService;
import com.heavymachinery.service.WorkOrderService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
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
    private final RentalContractRepository rentalContractRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SparePartRepository sparePartRepository;
    private final ContractRepository contractRepository;
    private final OrgService orgService;

    public AdminStatsController(MachineryRepository machineryRepository,
                                ProjectRepository projectRepository,
                                WorkOrderService workOrderService,
                                DispatchService dispatchService,
                                RentalService rentalService,
                                RentalContractRepository rentalContractRepository,
                                PurchaseOrderRepository purchaseOrderRepository,
                                SparePartRepository sparePartRepository,
                                ContractRepository contractRepository,
                                OrgService orgService) {
        this.machineryRepository = machineryRepository;
        this.projectRepository = projectRepository;
        this.workOrderService = workOrderService;
        this.dispatchService = dispatchService;
        this.rentalService = rentalService;
        this.rentalContractRepository = rentalContractRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.sparePartRepository = sparePartRepository;
        this.contractRepository = contractRepository;
        this.orgService = orgService;
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

    @GetMapping("/finance")
    public ApiResponse<Map<String, Object>> finance() {
        List<Long> scope = orgService.visibleOrgIds();

        // 租赁应收（生效中 + 已完工合同金额）
        List<com.heavymachinery.entity.RentalContract> rentals =
                rentalContractRepository.findAll(OrgSpecs.withOrg(null, scope));
        BigDecimal rentalExpected = rentals.stream()
                .filter(r -> "active".equals(r.getStatus()) || "returned".equals(r.getStatus()))
                .map(r -> r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal rentalActual = rentals.stream()
                .filter(r -> "returned".equals(r.getStatus()))
                .map(r -> r.getTotalAmount() != null ? r.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 采购支出
        List<com.heavymachinery.entity.PurchaseOrder> purchases =
                purchaseOrderRepository.findAll(OrgSpecs.withOrg(null, scope));
        BigDecimal purchaseTotal = purchases.stream()
                .filter(p -> "approved".equals(p.getStatus()) || "paid".equals(p.getStatus()) || "received".equals(p.getStatus()))
                .map(p -> p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 客户合同
        List<com.heavymachinery.entity.Contract> contracts =
                contractRepository.findAll(OrgSpecs.withOrg(null, scope));
        BigDecimal contractTotal = contracts.stream()
                .filter(c -> "active".equals(c.getStatus()))
                .map(c -> c.getAmount() != null ? c.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 备件库存价值
        List<com.heavymachinery.entity.SparePart> parts =
                sparePartRepository.findAll(OrgSpecs.withOrg(null, scope));
        BigDecimal stockValue = parts.stream()
                .map(p -> (p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO)
                        .multiply(p.getStockQty() != null ? p.getStockQty() : BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("rentalExpected", rentalExpected);
        result.put("rentalActual", rentalActual);
        result.put("purchaseTotal", purchaseTotal);
        result.put("contractTotal", contractTotal);
        result.put("stockValue", stockValue);
        result.put("pendingApprovals",
                rentalContractRepository.count() == 0 ? 0L : rentalContractRepository.findAll().stream()
                        .filter(r -> "pending".equals(r.getStatus())).count());
        return ApiResponse.success(result);
    }
}