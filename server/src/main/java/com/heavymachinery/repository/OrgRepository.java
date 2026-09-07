package com.heavymachinery.repository;

import com.heavymachinery.entity.Org;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrgRepository extends JpaRepository<Org, Long> {

    boolean existsByCode(String code);

    Optional<Org> findByCode(String code);

    List<Org> findAllByOrderByOrgLevelAscIdAsc();
}