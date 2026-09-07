package com.heavymachinery.repository;

import com.heavymachinery.entity.SysMenu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SysMenuRepository extends JpaRepository<SysMenu, Long> {

    List<SysMenu> findByEnabledTrueOrderBySortAscIdAsc();

    List<SysMenu> findAllByOrderBySortAscIdAsc();
}