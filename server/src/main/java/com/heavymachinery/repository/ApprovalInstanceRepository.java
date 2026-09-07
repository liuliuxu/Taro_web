package com.heavymachinery.repository;

import com.heavymachinery.entity.ApprovalInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ApprovalInstanceRepository extends JpaRepository<ApprovalInstance, Long>, JpaSpecificationExecutor<ApprovalInstance> {
    List<ApprovalInstance> findByApplicantIdOrderByCreatedAtDesc(Long applicantId);
    List<ApprovalInstance> findByStatusOrderByCreatedAtDesc(String status);
}