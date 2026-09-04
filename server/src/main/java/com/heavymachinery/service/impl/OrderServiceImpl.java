package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.dto.OrderCreateRequest;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.Order;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.OrderRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final MachineryRepository machineryRepository;
    private final AuthService authService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            MachineryRepository machineryRepository,
                            AuthService authService) {
        this.orderRepository = orderRepository;
        this.machineryRepository = machineryRepository;
        this.authService = authService;
    }

    @Override
    @Transactional
    public Order createOrder(OrderCreateRequest request) {
        Machinery machinery = machineryRepository.findById(request.getMachineryId())
                .orElseThrow(() -> new BusinessException(404, "设备不存在"));

        if (!"available".equals(machinery.getStatus())) {
            throw new BusinessException("该设备当前不可购买/租赁");
        }
        if (machinery.getStock() <= 0) {
            throw new BusinessException("该设备库存不足");
        }

        String type = request.getType();
        if (!"purchase".equals(type) && !"rental".equals(type)) {
            throw new BusinessException("无效的订单类型");
        }

        User currentUser = authService.getCurrentUser();

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setMachineryId(machinery.getId());
        order.setMachineryName(machinery.getName());
        order.setUserId(currentUser.getId());
        order.setType(type);
        order.setAmount(machinery.getPrice());
        order.setContactPhone(request.getContactPhone() != null ? request.getContactPhone() : currentUser.getPhone());
        order.setStatus("pending");

        Order saved = orderRepository.save(order);

        // 扣减库存
        if ("purchase".equals(type)) {
            machinery.setStock(machinery.getStock() - 1);
            machineryRepository.save(machinery);
        }

        return saved;
    }

    @Override
    public List<Order> getMyOrders() {
        User currentUser = authService.getCurrentUser();
        return getOrdersByUser(currentUser.getId());
    }

    @Override
    public List<Order> getOrdersByUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    private String generateOrderNo() {
        LocalDateTime now = LocalDateTime.now();
        String timePart = now.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int randomPart = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "HM" + timePart + randomPart;
    }
}
