package com.heavymachinery.repository;

import com.heavymachinery.entity.DispatchTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DispatchTaskRepository extends JpaRepository<DispatchTask, Long>, JpaSpecificationExecutor<DispatchTask> {

    List<DispatchTask> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<DispatchTask> findByAssigneeUserIdOrderByCreatedAtDesc(Long assigneeUserId);

    List<DispatchTask> findByAssigneeUserIdAndStatusInOrderByCreatedAtDesc(Long assigneeUserId, List<String> statuses);

    long countByStatus(String status);
}