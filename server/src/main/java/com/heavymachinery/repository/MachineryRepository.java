package com.heavymachinery.repository;

import com.heavymachinery.entity.Machinery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MachineryRepository extends JpaRepository<Machinery, Long>, JpaSpecificationExecutor<Machinery> {

    Page<Machinery> findByCategory(String category, Pageable pageable);

    Page<Machinery> findByNameContainingOrModelContaining(String name, String model, Pageable pageable);

    Page<Machinery> findByStatus(String status, Pageable pageable);

    List<Machinery> findByRecommendedTrue();

    @Query("SELECT DISTINCT m.category FROM Machinery m WHERE m.category IS NOT NULL")
    List<String> findDistinctCategories();
}
