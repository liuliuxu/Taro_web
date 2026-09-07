package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.PurchaseOrder;
import com.heavymachinery.entity.SparePart;
import com.heavymachinery.entity.StockRecord;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.PurchaseOrderRepository;
import com.heavymachinery.repository.SparePartRepository;
import com.heavymachinery.repository.StockRecordRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 采购申请管理
 */
@RestController
@RequestMapping("/api/admin/purchases")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPurchaseOrderController {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SparePartRepository sparePartRepository;
    private final StockRecordRepository stockRecordRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public AdminPurchaseOrderController(PurchaseOrderRepository purchaseOrderRepository,
                                        SparePartRepository sparePartRepository,
                                        StockRecordRepository stockRecordRepository,
                                        OrgService orgService,
                                        AuthService authService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.sparePartRepository = sparePartRepository;
        this.stockRecordRepository = stockRecordRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<PurchaseOrder>> list(@RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String keyword) {
        List<PurchaseOrder> list = purchaseOrderRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(p -> status == null || status.isEmpty() || status.equals(p.getStatus()))
                .filter(p -> keyword == null || keyword.isEmpty()
                        || p.getOrderNo().contains(keyword)
                        || p.getItemName().contains(keyword)
                        || (p.getSupplierName() != null && p.getSupplierName().contains(keyword)))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<PurchaseOrder> create(@RequestBody PurchaseOrder order) {
        User u = authService.getCurrentUser();
        order.setOrderNo(genNo());
        if (order.getStatus() == null) order.setStatus("pending");
        if (order.getOrgId() == null && u != null) order.setOrgId(u.getOrgId());
        if (u != null) {
            order.setApplicantId(u.getId());
            order.setApplicantName(u.getNickname() != null ? u.getNickname() : u.getUsername());
        }
        if (order.getQuantity() != null && order.getUnitPrice() != null) {
            order.setTotalAmount(order.getQuantity().multiply(order.getUnitPrice()));
        }
        return ApiResponse.success("创建成功", purchaseOrderRepository.save(order));
    }

    /** 状态流转：approve/reject/cancel/paid */
    @PostMapping("/{id}/status")
    public ApiResponse<PurchaseOrder> changeStatus(@PathVariable Long id, @RequestParam String status) {
        PurchaseOrder p = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "采购单不存在"));
        String next = switch (status) {
            case "approve" -> "approved";
            case "reject" -> "rejected";
            case "cancel" -> "cancelled";
            case "paid" -> "paid";
            default -> throw new BusinessException(400, "非法状态: " + status);
        };
        p.setStatus(next);
        return ApiResponse.success("更新成功", purchaseOrderRepository.save(p));
    }

    /** 入库验收：若存在同名备件则自动增加库存 */
    @PostMapping("/{id}/receive")
    public ApiResponse<PurchaseOrder> receive(@PathVariable Long id) {
        PurchaseOrder p = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "采购单不存在"));
        if (!"paid".equals(p.getStatus()) && !"approved".equals(p.getStatus())) {
            throw new BusinessException(400, "仅已审批/已付款采购单可入库");
        }
        p.setStatus("received");
        purchaseOrderRepository.save(p);

        sparePartRepository.findAll().stream()
                .filter(part -> part.getName() != null && part.getName().equals(p.getItemName()))
                .findFirst()
                .ifPresentOrElse(part -> {
                    BigDecimal qty = p.getQuantity() != null ? p.getQuantity() : BigDecimal.ZERO;
                    part.setStockQty((part.getStockQty() != null ? part.getStockQty() : BigDecimal.ZERO).add(qty));
                    sparePartRepository.save(part);
                    saveStockRecord(part, qty, p.getOrderNo());
                }, () -> {
                    if (p.getItemName() != null && !p.getItemName().isEmpty()) {
                        SparePart part = new SparePart();
                        part.setPartNo("SP" + System.currentTimeMillis() % 1000000);
                        part.setName(p.getItemName());
                        part.setCategory("采购件");
                        part.setStockQty(p.getQuantity() != null ? p.getQuantity() : BigDecimal.ZERO);
                        part.setMinStock(BigDecimal.ZERO);
                        part.setUnit(p.getUnit());
                        part.setOrgId(p.getOrgId());
                        part = sparePartRepository.save(part);
                        saveStockRecord(part, part.getStockQty(), p.getOrderNo());
                    }
                });
        return ApiResponse.success("已入库", p);
    }

    private void saveStockRecord(SparePart part, BigDecimal qty, String relateNo) {
        StockRecord r = new StockRecord();
        r.setPartId(part.getId());
        r.setPartName(part.getName());
        r.setType("in");
        r.setQty(qty);
        r.setUnit(part.getUnit());
        r.setRelateNo(relateNo);
        r.setOrgId(part.getOrgId());
        r.setRemark("采购入库");
        stockRecordRepository.save(r);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        purchaseOrderRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }

    private String genNo() {
        return "CG" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 999);
    }
}