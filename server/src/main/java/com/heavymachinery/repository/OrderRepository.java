package com.heavymachinery.repository;

import com.heavymachinery.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndStatus(Long userId, String status);

    List<Order> findByStatusOrderByCreatedAtDesc(String status);
}
