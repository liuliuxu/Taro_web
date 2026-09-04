package com.heavymachinery.service;

import com.heavymachinery.dto.OrderCreateRequest;
import com.heavymachinery.entity.Order;

import java.util.List;

public interface OrderService {

    Order createOrder(OrderCreateRequest request);

    List<Order> getMyOrders();

    List<Order> getOrdersByUser(Long userId);
}
