package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.ProjectCreateRequest;
import com.heavymachinery.dto.ProjectVO;
import com.heavymachinery.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 工程管理接口（PC 后台）
 */
@RestController
@RequestMapping("/api/admin/projects")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProjectController {

    private final ProjectService projectService;

    public AdminProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<ProjectVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(projectService.list(page, pageSize, status, keyword));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectVO> detail(@PathVariable Long id) {
        return ApiResponse.success(projectService.getDetail(id));
    }

    @PostMapping
    public ApiResponse<ProjectVO> create(@Valid @RequestBody ProjectCreateRequest request) {
        return ApiResponse.success("项目创建成功", projectService.create(request));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProjectVO> update(@PathVariable Long id,
                                         @Valid @RequestBody ProjectCreateRequest request) {
        return ApiResponse.success("项目更新成功", projectService.update(id, request));
    }

    @PostMapping("/{id}/status")
    public ApiResponse<ProjectVO> changeStatus(@PathVariable Long id,
                                               @RequestBody Map<String, String> body) {
        return ApiResponse.success(projectService.changeStatus(id, body.get("status")));
    }
}