package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.SparePart;
import com.heavymachinery.entity.StockRecord;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.SparePartRepository;
import com.heavymachinery.repository.StockRecordRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 备件/物料库存管理（含出入库）
 */
@RestController
@RequestMapping("/api/admin/spare-parts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSparePartController {

    private final SparePartRepository sparePartRepository;
    private final StockRecordRepository stockRecordRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public AdminSparePartController(SparePartRepository sparePartRepository,
                                    StockRecordRepository stockRecordRepository,
                                    OrgService orgService,
                                    AuthService authService) {
        this.sparePartRepository = sparePartRepository;
        this.stockRecordRepository = stockRecordRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<SparePart>> list(@RequestParam(required = false) String keyword,
                                             @RequestParam(required = false) String category) {
        List<SparePart> list = sparePartRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.ASC, "partNo"))
                .stream()
                .filter(p -> category == null || category.isEmpty() || category.equals(p.getCategory()))
                .filter(p -> keyword == null || keyword.isEmpty()
                        || p.getName().contains(keyword)
                        || p.getPartNo().contains(keyword))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @GetMapping("/stock-records")
    public ApiResponse<List<StockRecord>> records(@RequestParam(required = false) Long partId) {
        List<StockRecord> list = partId != null
                ? stockRecordRepository.findByPartIdOrderByCreatedAtDesc(partId)
                : stockRecordRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<SparePart> create(@RequestBody SparePart part) {
        User u = authService.getCurrentUser();
        if (part.getOrgId() == null && u != null) part.setOrgId(u.getOrgId());
        if (part.getStockQty() == null) part.setStockQty(BigDecimal.ZERO);
        if (part.getMinStock() == null) part.setMinStock(BigDecimal.ZERO);
        return ApiResponse.success("创建成功", sparePartRepository.save(part));
    }

    @PutMapping("/{id}")
    public ApiResponse<SparePart> update(@PathVariable Long id, @RequestBody SparePart body) {
        SparePart p = sparePartRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "备件不存在"));
        p.setPartNo(body.getPartNo());
        p.setName(body.getName());
        p.setCategory(body.getCategory());
        p.setSpec(body.getSpec());
        p.setUnit(body.getUnit());
        p.setMinStock(body.getMinStock());
        p.setPrice(body.getPrice());
        p.setWarehouse(body.getWarehouse());
        p.setRemark(body.getRemark());
        return ApiResponse.success("更新成功", sparePartRepository.save(p));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        sparePartRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }

    /** 入/出库: type=in|out */
    @PostMapping("/{id}/stock")
    public ApiResponse<SparePart> stock(@PathVariable Long id,
                                        @RequestParam String type,
                                        @RequestParam BigDecimal qty,
                                        @RequestParam(required = false) String relateNo,
                                        @RequestParam(required = false) String remark) {
        SparePart p = sparePartRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "备件不存在"));
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(400, "数量必须大于0");
        }
        BigDecimal diff = "in".equals(type) ? qty : qty.negate();
        BigDecimal after = (p.getStockQty() != null ? p.getStockQty() : BigDecimal.ZERO).add(diff);
        if (after.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(400, "库存不足");
        }
        p.setStockQty(after);
        sparePartRepository.save(p);

        StockRecord r = new StockRecord();
        r.setPartId(p.getId());
        r.setPartName(p.getName());
        r.setType(type);
        r.setQty(qty);
        r.setUnit(p.getUnit());
        r.setRelateNo(relateNo);
        r.setRemark(remark);
        User u = authService.getCurrentUser();
        if (u != null) {
            r.setOperatorId(u.getId());
            r.setOperatorName(u.getNickname() != null ? u.getNickname() : u.getUsername());
            r.setOrgId(u.getOrgId());
        }
        stockRecordRepository.save(r);
        return ApiResponse.success("操作成功", p);
    }
}