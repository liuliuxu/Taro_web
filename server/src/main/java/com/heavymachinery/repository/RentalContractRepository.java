package com.heavymachinery.repository;

import com.heavymachinery.entity.RentalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RentalContractRepository extends JpaRepository<RentalContract, Long>, JpaSpecificationExecutor<RentalContract> {

    List<RentalContract> findByStatusOrderByCreatedAtDesc(String status);

    long countByStatus(String status);
}