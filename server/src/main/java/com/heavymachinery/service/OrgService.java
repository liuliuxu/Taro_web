package com.heavymachinery.service;

import com.heavymachinery.dto.OrgVO;
import com.heavymachinery.entity.Org;

import java.util.List;
import java.util.Map;

public interface OrgService {

    List<OrgVO> tree();

    List<Org> listAll();

    OrgVO create(Org org);

    OrgVO update(Long id, Org org);

    void delete(Long id);

    Map<Long, String> idNameMap();

    /** 当前用户可见的机构Id集合；null 表示不限制（系统管理员） */
    List<Long> visibleOrgIds();

    /** 判断某机构Id是否在当前用户可见范围内 */
    boolean visible(Long orgId);

    /** 某机构及其所有子孙机构的Id集合 */
    List<Long> orgAndDescendants(Long orgId);
}