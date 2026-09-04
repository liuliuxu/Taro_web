package com.heavymachinery.controller.admin;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.entity.Order;
import com.heavymachinery.repository.OrderRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 订单管理接口（供 PC 后台管理系统使用）
 */
@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final OrderRepository orderRepository;

    public AdminOrderController(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @GetMapping("/list")
    public ApiResponse<List<Order>> list(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty()) {
            return ApiResponse.success(orderRepository.findByStatusOrderByCreatedAtDesc(status));
        }
        return ApiResponse.success(orderRepository.findAll());
    }

    @PutMapping("/{id}/status")
    public ApiResponse<Order> updateStatus(@PathVariable Long id, @RequestBody String status) {
        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            return ApiResponse.error(404, "订单不存在");
        }
        order.setStatus(status);
        return ApiResponse.success(orderRepository.save(order));
    }
}
