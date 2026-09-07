package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.Supplier;
import com.heavymachinery.repository.SupplierRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 供应商管理
 */
@RestController
@RequestMapping("/api/admin/suppliers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSupplierController {

    private final SupplierRepository supplierRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public AdminSupplierController(SupplierRepository supplierRepository,
                                   OrgService orgService,
                                   AuthService authService) {
        this.supplierRepository = supplierRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<Supplier>> list(@RequestParam(required = false) String keyword) {
        List<Supplier> list = supplierRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(s -> keyword == null || keyword.isEmpty()
                        || s.getName().contains(keyword)
                        || (s.getContact() != null && s.getContact().contains(keyword)))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<Supplier> create(@RequestBody Supplier supplier) {
        if (authService.getCurrentUser() != null) supplier.setOrgId(authService.getCurrentUser().getOrgId());
        if (supplier.getStatus() == null) supplier.setStatus("enabled");
        return ApiResponse.success("创建成功", supplierRepository.save(supplier));
    }

    @PutMapping("/{id}")
    public ApiResponse<Supplier> update(@PathVariable Long id, @RequestBody Supplier body) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "供应商不存在"));
        s.setName(body.getName());
        s.setContact(body.getContact());
        s.setPhone(body.getPhone());
        s.setCategory(body.getCategory());
        s.setAddress(body.getAddress());
        s.setCreditLevel(body.getCreditLevel());
        s.setStatus(body.getStatus());
        s.setRemark(body.getRemark());
        return ApiResponse.success("更新成功", supplierRepository.save(s));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        supplierRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }
}