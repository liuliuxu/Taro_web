package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.Contract;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.ContractRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 客户/合同管理
 */
@RestController
@RequestMapping("/api/admin/contracts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminContractController {

    private final ContractRepository contractRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public AdminContractController(ContractRepository contractRepository,
                                   OrgService orgService,
                                   AuthService authService) {
        this.contractRepository = contractRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<Contract>> list(@RequestParam(required = false) String status,
                                            @RequestParam(required = false) String keyword) {
        List<Contract> list = contractRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(c -> status == null || status.isEmpty() || status.equals(c.getStatus()))
                .filter(c -> keyword == null || keyword.isEmpty()
                        || c.getContractNo().contains(keyword)
                        || c.getCustomerName().contains(keyword))
                .collect(java.util.stream.Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<Contract> create(@RequestBody Contract contract) {
        User u = authService.getCurrentUser();
        if (contract.getOrgId() == null && u != null) contract.setOrgId(u.getOrgId());
        if (contract.getStatus() == null) contract.setStatus("draft");
        contract.setContractNo("HT" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 999));
        return ApiResponse.success("创建成功", contractRepository.save(contract));
    }

    @PutMapping("/{id}")
    public ApiResponse<Contract> update(@PathVariable Long id, @RequestBody Contract body) {
        Contract c = contractRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "合同不存在"));
        c.setCustomerName(body.getCustomerName());
        c.setContact(body.getContact());
        c.setPhone(body.getPhone());
        c.setType(body.getType());
        c.setAmount(body.getAmount());
        c.setStartDate(body.getStartDate());
        c.setEndDate(body.getEndDate());
        c.setStatus(body.getStatus());
        c.setRemark(body.getRemark());
        return ApiResponse.success("更新成功", contractRepository.save(c));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        contractRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }
}