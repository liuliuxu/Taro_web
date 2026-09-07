package com.heavymachinery.repository;

import com.heavymachinery.entity.FormDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface FormDefinitionRepository extends JpaRepository<FormDefinition, Long>, JpaSpecificationExecutor<FormDefinition> {
    List<FormDefinition> findByBizTypeOrderByCreatedAtDesc(String bizType);
}