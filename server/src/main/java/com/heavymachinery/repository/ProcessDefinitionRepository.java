package com.heavymachinery.repository;

import com.heavymachinery.entity.ProcessDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ProcessDefinitionRepository extends JpaRepository<ProcessDefinition, Long>, JpaSpecificationExecutor<ProcessDefinition> {
    List<ProcessDefinition> findByStatusOrderByCreatedAtDesc(String status);
}