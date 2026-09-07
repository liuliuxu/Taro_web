package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.Announcement;
import com.heavymachinery.entity.ApprovalInstance;
import com.heavymachinery.entity.Contract;
import com.heavymachinery.entity.InspectionPlan;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.entity.PurchaseOrder;
import com.heavymachinery.entity.RentalContract;
import com.heavymachinery.entity.SparePart;
import com.heavymachinery.entity.Supplier;
import com.heavymachinery.entity.User;
import com.heavymachinery.entity.WorkOrder;
import com.heavymachinery.repository.AnnouncementRepository;
import com.heavymachinery.repository.ApprovalInstanceRepository;
import com.heavymachinery.repository.ContractRepository;
import com.heavymachinery.repository.InspectionPlanRepository;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.OrgRepository;
import com.heavymachinery.repository.PurchaseOrderRepository;
import com.heavymachinery.repository.RentalContractRepository;
import com.heavymachinery.repository.SparePartRepository;
import com.heavymachinery.repository.StockRecordRepository;
import com.heavymachinery.repository.SupplierRepository;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.repository.WorkOrderRepository;
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
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
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
    private final WorkOrderRepository workOrderRepository;
    private final ApprovalInstanceRepository approvalInstanceRepository;
    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;
    private final OrgRepository orgRepository;
    private final StockRecordRepository stockRecordRepository;
    private final AnnouncementRepository announcementRepository;
    private final InspectionPlanRepository inspectionPlanRepository;

    public AdminStatsController(MachineryRepository machineryRepository,
                                ProjectRepository projectRepository,
                                WorkOrderService workOrderService,
                                DispatchService dispatchService,
                                RentalService rentalService,
                                RentalContractRepository rentalContractRepository,
                                PurchaseOrderRepository purchaseOrderRepository,
                                SparePartRepository sparePartRepository,
                                ContractRepository contractRepository,
                                OrgService orgService,
                                WorkOrderRepository workOrderRepository,
                                ApprovalInstanceRepository approvalInstanceRepository,
                                SupplierRepository supplierRepository,
                                UserRepository userRepository,
                                OrgRepository orgRepository,
                                StockRecordRepository stockRecordRepository,
                                AnnouncementRepository announcementRepository,
                                InspectionPlanRepository inspectionPlanRepository) {
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
        this.workOrderRepository = workOrderRepository;
        this.approvalInstanceRepository = approvalInstanceRepository;
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
        this.orgRepository = orgRepository;
        this.stockRecordRepository = stockRecordRepository;
        this.announcementRepository = announcementRepository;
        this.inspectionPlanRepository = inspectionPlanRepository;
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

    @GetMapping("/charts")
    public ApiResponse<Map<String, Object>> charts() {
        List<Long> scope = orgService.visibleOrgIds();
        Map<String, Object> result = new LinkedHashMap<>();

        // 设备分类 / 品牌
        Map<String, Long> deviceCategory = new LinkedHashMap<>();
        Map<String, Long> deviceBrand = new LinkedHashMap<>();
        machineryRepository.findAll(OrgSpecs.withOrg(null, scope)).forEach(m -> {
            if (m.getCategory() != null) deviceCategory.merge(m.getCategory(), 1L, Long::sum);
            if (m.getBrand() != null) deviceBrand.merge(m.getBrand(), 1L, Long::sum);
        });
        result.put("deviceCategory", deviceCategory);
        result.put("deviceBrand", deviceBrand);

        // 工单状态分布
        List<WorkOrder> workOrders = workOrderRepository.findAll(OrgSpecs.withOrg(null, scope));
        List<Map<String, Object>> workOrderByStatus = new ArrayList<>();
        countByKey(workOrders, WorkOrder::getStatus).forEach((k, v) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("status", k);
            row.put("count", v);
            workOrderByStatus.add(row);
        });
        result.put("workOrderByStatus", workOrderByStatus);
        result.put("workOrderByMonth", countByMonth(workOrders.stream()
                .map(WorkOrder::getCreatedAt).collect(Collectors.toList())));

        // 工程 / 租赁 / 客户合同 状态
        result.put("projectByStatus", projectRepository.findAll(OrgSpecs.withOrg(null, scope)).stream()
                .filter(p -> p.getStatus() != null)
                .collect(Collectors.groupingBy(com.heavymachinery.entity.Project::getStatus, Collectors.counting())));
        result.put("rentalByStatus", rentalContractRepository.findAll(OrgSpecs.withOrg(null, scope)).stream()
                .collect(Collectors.groupingBy(RentalContract::getStatus, Collectors.counting())));
        result.put("contractByStatus", contractRepository.findAll(OrgSpecs.withOrg(null, scope)).stream()
                .collect(Collectors.groupingBy(Contract::getStatus, Collectors.counting())));

        // 采购状态 + 月度金额
        List<PurchaseOrder> purchases = purchaseOrderRepository.findAll(OrgSpecs.withOrg(null, scope));
        result.put("purchaseByStatus", purchases.stream()
                .collect(Collectors.groupingBy(PurchaseOrder::getStatus, Collectors.counting())));
        List<Map<String, Object>> purchaseByMonth = new ArrayList<>();
        Map<String, BigDecimal> purchaseAmount = new TreeMap<>();
        purchases.stream().filter(p -> p.getCreatedAt() != null)
                .forEach(p -> {
                    String m = p.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                    purchaseAmount.merge(m, p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO, BigDecimal::add);
                });
        querySixMonths().forEach(mon -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", mon);
            row.put("amount", purchaseAmount.getOrDefault(mon, BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP).doubleValue());
            purchaseByMonth.add(row);
        });
        result.put("purchaseByMonth", purchaseByMonth);

        // 审批状态 + 月度
        List<ApprovalInstance> approvals = approvalInstanceRepository.findAll(OrgSpecs.withOrg(null, scope));
        result.put("approvalByStatus", approvals.stream()
                .collect(Collectors.groupingBy(ApprovalInstance::getStatus, Collectors.counting())));
        result.put("approvalByMonth", countByMonth(approvals.stream()
                .map(ApprovalInstance::getCreatedAt).collect(Collectors.toList())));

        // 库存货值（按分类）
        Map<String, BigDecimal> stockValue = new LinkedHashMap<>();
        sparePartRepository.findAll(OrgSpecs.withOrg(null, scope)).forEach(sp -> {
            String c = sp.getCategory() != null ? sp.getCategory() : "未分类";
            BigDecimal v = sp.getPrice() != null ? sp.getPrice().multiply(sp.getStockQty() != null ? sp.getStockQty() : BigDecimal.ZERO) : BigDecimal.ZERO;
            stockValue.merge(c, v, BigDecimal::add);
        });
        result.put("stockValueByCategory", stockValue);

        // 供应商 / 用户 / 机构 / 公告 / 巡检
        result.put("supplierByCategory", supplierRepository.findAll(OrgSpecs.withOrg(null, scope)).stream()
                .filter(s -> s.getCategory() != null)
                .collect(Collectors.groupingBy(Supplier::getCategory, Collectors.counting())));
        result.put("userByRole", userRepository.findAll(OrgSpecs.withOrg(null, null)).stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting())));
        result.put("orgCount", orgRepository.count());
        result.put("announcementCount", announcementRepository.findAll(OrgSpecs.withOrg(null, scope)).size());
        result.put("inspectionTotal", inspectionPlanRepository.findAll(OrgSpecs.withOrg(null, scope)).size());
        result.put("dispatchTotal", dispatchService.stats().getOrDefault("total", 0L));

        return ApiResponse.success(result);
    }

    /** 统计近6个月的月度数量（含本月，倒序补足6个月） */
    private List<Map<String, Object>> countByMonth(List<LocalDateTime> times) {
        List<String> months = querySixMonths();
        Map<String, Long> counter = new TreeMap<>();
        for (String m : months) counter.put(m, 0L);
        times.stream().filter(t -> t != null)
                .map(t -> t.toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .forEach(m -> counter.merge(m, 1L, Long::sum));
        List<Map<String, Object>> rows = new ArrayList<>();
        for (String m : months) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("month", m);
            row.put("count", counter.getOrDefault(m, 0L));
            rows.add(row);
        }
        return rows;
    }

    private List<String> querySixMonths() {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        List<String> months = new ArrayList<>();
        LocalDate cur = LocalDate.now().withDayOfMonth(1);
        for (int i = 5; i >= 0; i--) {
            months.add(cur.minusMonths(i).format(fmt));
        }
        return months;
    }

    private <T> Map<String, Long> countByKey(List<T> list, java.util.function.Function<T, String> keyFn) {
        return list.stream()
                .filter(x -> keyFn.apply(x) != null)
                .collect(Collectors.groupingBy(keyFn, Collectors.counting()));
    }
}