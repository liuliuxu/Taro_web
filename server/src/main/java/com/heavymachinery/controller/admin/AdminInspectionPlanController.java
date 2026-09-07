package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.BusinessException;
import com.heavymachinery.entity.InspectionPlan;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.InspectionPlanRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 设备巡检/保养计划管理
 */
@RestController
@RequestMapping("/api/admin/inspection-plans")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInspectionPlanController {

    private final InspectionPlanRepository inspectionPlanRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public AdminInspectionPlanController(InspectionPlanRepository inspectionPlanRepository,
                                         OrgService orgService,
                                         AuthService authService) {
        this.inspectionPlanRepository = inspectionPlanRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<InspectionPlan>> list(@RequestParam(required = false) String status,
                                                  @RequestParam(required = false) String type) {
        List<InspectionPlan> list = inspectionPlanRepository.findAll(
                        OrgSpecs.withOrg(null, orgService.visibleOrgIds()),
                        Sort.by(Sort.Direction.ASC, "nextDueAt"))
                .stream()
                .filter(p -> status == null || status.isEmpty() || status.equals(p.getStatus()))
                .filter(p -> type == null || type.isEmpty() || type.equals(p.getType()))
                .collect(Collectors.toList());
        return ApiResponse.success(list);
    }

    @PostMapping
    public ApiResponse<InspectionPlan> create(@RequestBody InspectionPlan plan) {
        User u = authService.getCurrentUser();
        if (plan.getOrgId() == null && u != null) plan.setOrgId(u.getOrgId());
        if (plan.getCycleDays() == null || plan.getCycleDays() <= 0) {
            throw new BusinessException(400, "周期天数必须大于0");
        }
        if (plan.getNextDueAt() == null) plan.setNextDueAt(LocalDate.now().plusDays(plan.getCycleDays()));
        if (plan.getStatus() == null) plan.setStatus("created");
        return ApiResponse.success("创建成功", inspectionPlanRepository.save(plan));
    }

    @PutMapping("/{id}")
    public ApiResponse<InspectionPlan> update(@PathVariable Long id, @RequestBody InspectionPlan body) {
        InspectionPlan p = inspectionPlanRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "计划不存在"));
        p.setMachineryId(body.getMachineryId());
        p.setMachineryName(body.getMachineryName());
        p.setType(body.getType());
        p.setContent(body.getContent());
        p.setCycleDays(body.getCycleDays());
        p.setAssigneeId(body.getAssigneeId());
        p.setAssigneeName(body.getAssigneeName());
        p.setRemark(body.getRemark());
        return ApiResponse.success("更新成功", inspectionPlanRepository.save(p));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        inspectionPlanRepository.deleteById(id);
        return ApiResponse.success("删除成功", null);
    }
}