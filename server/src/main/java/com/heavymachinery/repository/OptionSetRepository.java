package com.heavymachinery.repository;

import com.heavymachinery.entity.OptionSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface OptionSetRepository extends JpaRepository<OptionSet, Long>, JpaSpecificationExecutor<OptionSet> {
    boolean existsByCode(String code);
    Optional<OptionSet> findByCode(String code);
}