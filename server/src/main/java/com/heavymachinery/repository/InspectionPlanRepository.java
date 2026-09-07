package com.heavymachinery.repository;

import com.heavymachinery.entity.InspectionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface InspectionPlanRepository extends JpaRepository<InspectionPlan, Long>, JpaSpecificationExecutor<InspectionPlan> {
    List<InspectionPlan> findByAssigneeIdOrderByNextDueAtAsc(Long assigneeId);
}