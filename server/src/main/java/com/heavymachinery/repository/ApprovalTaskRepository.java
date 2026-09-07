package com.heavymachinery.repository;

import com.heavymachinery.entity.ApprovalTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ApprovalTaskRepository extends JpaRepository<ApprovalTask, Long>, JpaSpecificationExecutor<ApprovalTask> {
    List<ApprovalTask> findByInstanceIdOrderByNodeIndexAsc(Long instanceId);
    List<ApprovalTask> findByStatusOrderByCreatedAtDesc(String status);
}