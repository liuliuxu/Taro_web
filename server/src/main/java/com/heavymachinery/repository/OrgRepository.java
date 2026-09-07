package com.heavymachinery.repository;

import com.heavymachinery.entity.Org;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface OrgRepository extends JpaRepository<Org, Long>, JpaSpecificationExecutor<Org> {

    boolean existsByCode(String code);

    Optional<Org> findByCode(String code);

    List<Org> findAllByOrderByOrgLevelAscIdAsc();
}