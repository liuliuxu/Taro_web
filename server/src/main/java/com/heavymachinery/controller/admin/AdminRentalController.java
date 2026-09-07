package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.RentalContractCreateRequest;
import com.heavymachinery.dto.RentalHandleRequest;
import com.heavymachinery.dto.RentalVO;
import com.heavymachinery.entity.User;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.RentalService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 租赁管理接口（PC 后台）
 */
@RestController
@RequestMapping("/api/admin/rentals")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRentalController {

    private final RentalService rentalService;
    private final AuthService authService;

    public AdminRentalController(RentalService rentalService, AuthService authService) {
        this.rentalService = rentalService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<PageResult<RentalVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.success(rentalService.list(page, pageSize, status, keyword));
    }

    @GetMapping("/{id}")
    public ApiResponse<RentalVO> detail(@PathVariable Long id) {
        return ApiResponse.success(rentalService.getDetail(id));
    }

    @PostMapping
    public ApiResponse<RentalVO> create(@Valid @RequestBody RentalContractCreateRequest request) {
        User current = authService.getCurrentUser();
        return ApiResponse.success("租赁合同创建成功", rentalService.create(request, current.getId()));
    }

    @PostMapping("/{id}/handle")
    public ApiResponse<RentalVO> handle(@PathVariable Long id,
                                        @Valid @RequestBody RentalHandleRequest request) {
        return ApiResponse.success("操作成功", rentalService.handle(id, request));
    }
}