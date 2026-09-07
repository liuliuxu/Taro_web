package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.ProjectCreateRequest;
import com.heavymachinery.dto.ProjectVO;
import com.heavymachinery.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 工程项目接口（移动端）
 */
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
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

    @PostMapping("/{id}/status")
    public ApiResponse<ProjectVO> changeStatus(@PathVariable Long id,
                                               @RequestBody Map<String, String> body) {
        return ApiResponse.success(projectService.changeStatus(id, body.get("status")));
    }
}