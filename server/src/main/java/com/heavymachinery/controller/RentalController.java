package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.dto.RentalContractCreateRequest;
import com.heavymachinery.dto.RentalHandleRequest;
import com.heavymachinery.dto.RentalVO;
import com.heavymachinery.entity.User;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.RentalService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 租赁接口（移动端）
 */
@RestController
@RequestMapping("/api/rentals")
public class RentalController {

    private final RentalService rentalService;
    private final AuthService authService;

    public RentalController(RentalService rentalService, AuthService authService) {
        this.rentalService = rentalService;
        this.authService = authService;
    }

    @GetMapping("/list")
    public ApiResponse<List<RentalVO>> list(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ApiResponse.success(rentalService.list(1, 100, status, null).getList());
        }
        return ApiResponse.success(rentalService.listActive());
    }

    @GetMapping("/active")
    public ApiResponse<List<RentalVO>> active() {
        return ApiResponse.success(rentalService.listActive());
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