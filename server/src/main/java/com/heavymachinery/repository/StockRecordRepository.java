package com.heavymachinery.repository;

import com.heavymachinery.entity.StockRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface StockRecordRepository extends JpaRepository<StockRecord, Long>, JpaSpecificationExecutor<StockRecord> {
    List<StockRecord> findByPartIdOrderByCreatedAtDesc(Long partId);
}