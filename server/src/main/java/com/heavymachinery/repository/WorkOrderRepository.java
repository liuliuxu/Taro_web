package com.heavymachinery.repository;

import com.heavymachinery.entity.WorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long>, JpaSpecificationExecutor<WorkOrder> {

    List<WorkOrder> findByStatusOrderByUpdatedAtDesc(String status);

    List<WorkOrder> findByAssigneeUserIdOrderByCreatedAtDesc(Long assigneeUserId);

    List<WorkOrder> findByReportUserIdOrderByCreatedAtDesc(Long reportUserId);

    long countByStatus(String status);

    long countByAssigneeUserIdAndStatusNot(Long assigneeUserId, String status);
}
