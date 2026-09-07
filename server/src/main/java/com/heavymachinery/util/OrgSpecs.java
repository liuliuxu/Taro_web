package com.heavymachinery.util;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

/**
 * 机构数据隔离辅助：拼接 orgId 可见范围（当前机构及子孙 + 集团级 null 数据）
 */
public class OrgSpecs {

    /** visibleOrgIds 为 null 表示不限制（系统管理员） */
    public static <T> Specification<T> withOrg(Specification<T> base, List<Long> visibleOrgIds) {
        return (root, query, cb) -> {
            Predicate p = base == null ? cb.conjunction() : base.toPredicate(root, query, cb);
            if (visibleOrgIds == null) {
                return p;
            }
            Predicate in = root.get("orgId").in(visibleOrgIds);
            Predicate isNull = cb.isNull(root.get("orgId"));
            return cb.and(p, cb.or(in, isNull));
        };
    }
}