package com.heavymachinery.controller;

import com.heavymachinery.common.ApiResponse;
import com.heavymachinery.dto.OrderCreateRequest;
import com.heavymachinery.entity.Order;
import com.heavymachinery.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ApiResponse<Order> create(@Valid @RequestBody OrderCreateRequest request) {
        return ApiResponse.success("下单成功", orderService.createOrder(request));
    }

    @GetMapping("/my")
    public ApiResponse<List<Order>> myOrders() {
        return ApiResponse.success(orderService.getMyOrders());
    }

    @GetMapping("/{id}")
    public ApiResponse<Order> detail(@PathVariable Long id) {
        return ApiResponse.success(orderService.getMyOrders()
                .stream().filter(o -> o.getId().equals(id)).findFirst()
                .orElse(null));
    }
}
