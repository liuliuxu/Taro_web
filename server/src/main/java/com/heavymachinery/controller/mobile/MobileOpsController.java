package com.heavymachinery.controller.mobile;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.*;
import com.heavymachinery.repository.*;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 移动端运营接口：公告 / 备件查询 / 采购申请 / 巡检保养任务
 */
@RestController
@RequestMapping("/api")
public class MobileOpsController {

    private final AnnouncementRepository announcementRepository;
    private final SparePartRepository sparePartRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InspectionPlanRepository inspectionPlanRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public MobileOpsController(AnnouncementRepository announcementRepository,
                               SparePartRepository sparePartRepository,
                               PurchaseOrderRepository purchaseOrderRepository,
                               InspectionPlanRepository inspectionPlanRepository,
                               OrgService orgService,
                               AuthService authService) {
        this.announcementRepository = announcementRepository;
        this.sparePartRepository = sparePartRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.inspectionPlanRepository = inspectionPlanRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    /* ===== 公告 ===== */

    @GetMapping("/announcements")
    public ApiResponse<List<Announcement>> announcements(@RequestParam(required = false) String type) {
        List<Announcement> list = announcementRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(a -> "published".equals(a.getStatus()))
                .filter(a -> type == null || type.isEmpty() || type.equals(a.getType()))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @GetMapping("/announcements/{id}")
    public ApiResponse<Announcement> announcementDetail(@PathVariable Long id) {
        return ApiResponse.success(announcementRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "公告不存在")));
    }

    /* ===== 备件查询 ===== */

    @GetMapping("/spare-parts")
    public ApiResponse<List<SparePart>> spareParts(@RequestParam(required = false) String keyword,
                                                   @RequestParam(required = false) Boolean lowStock) {
        List<SparePart> list = sparePartRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.ASC, "partNo"))
                .stream()
                .filter(p -> keyword == null || keyword.isEmpty()
                        || p.getName().contains(keyword)
                        || p.getPartNo().contains(keyword))
                .filter(p -> lowStock == null || !lowStock
                        || (p.getMinStock() != null && p.getStockQty() != null
                        && p.getStockQty().compareTo(p.getMinStock()) < 0))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    /* ===== 采购申请 ===== */

    @PostMapping("/purchases/apply")
    public ApiResponse<PurchaseOrder> purchaseApply(@RequestBody PurchaseOrder order) {
        User u = authService.getCurrentUser();
        if (u == null) throw new BusinessException(401, "未登录");
        order.setOrderNo("CG" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 999));
        order.setStatus("pending");
        order.setOrgId(u.getOrgId());
        order.setApplicantId(u.getId());
        order.setApplicantName(u.getNickname() != null ? u.getNickname() : u.getUsername());
        if (order.getQuantity() != null && order.getUnitPrice() != null) {
            order.setTotalAmount(order.getQuantity().multiply(order.getUnitPrice()));
        }
        return ApiResponse.success("申请已提交", purchaseOrderRepository.save(order));
    }

    @GetMapping("/purchases/my")
    public ApiResponse<List<PurchaseOrder>> myPurchases() {
        User u = authService.getCurrentUser();
        if (u == null) return ApiResponse.success(List.of());
        return ApiResponse.success(purchaseOrderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().filter(p -> u.getId().equals(p.getApplicantId())).collect(Collectors.toList()));
    }

    /* ===== 巡检/保养任务 ===== */

    @GetMapping("/inspection-plans/todo")
    public ApiResponse<List<InspectionPlan>> inspectionTodo() {
        User u = authService.getCurrentUser();
        if (u == null) return ApiResponse.success(List.of());
        return ApiResponse.success(inspectionPlanRepository.findByAssigneeIdOrderByNextDueAtAsc(u.getId())
                .stream().filter(p -> "created".equals(p.getStatus())).collect(Collectors.toList()));
    }

    @PostMapping("/inspection-plans/{id}/complete")
    public ApiResponse<InspectionPlan> completeInspection(@PathVariable Long id) {
        User u = authService.getCurrentUser();
        InspectionPlan p = inspectionPlanRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "计划不存在"));
        if (u == null || !u.getId().equals(p.getAssigneeId())) {
            throw new BusinessException(403, "仅责任人可完成");
        }
        p.setLastDoneAt(LocalDate.now());
        p.setNextDueAt(LocalDate.now().plusDays(p.getCycleDays() != null ? p.getCycleDays() : 0));
        p.setStatus("done");
        return ApiResponse.success("已完成", inspectionPlanRepository.save(p));
    }
}