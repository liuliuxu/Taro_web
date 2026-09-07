package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.dto.OrgVO;
import com.heavymachinery.entity.Org;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.OrgRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class OrgServiceImpl implements OrgService {

    private final OrgRepository orgRepository;
    private final AuthService authService;

    public OrgServiceImpl(OrgRepository orgRepository, AuthService authService) {
        this.orgRepository = orgRepository;
        this.authService = authService;
    }

    @Override
    public List<OrgVO> tree() {
        List<Org> all = orgRepository.findAllByOrderByOrgLevelAscIdAsc();
        Map<Long, OrgVO> voMap = all.stream().collect(Collectors.toMap(Org::getId, OrgVO::from, (a, b) -> a));
        List<OrgVO> roots = new ArrayList<>();
        for (Org o : all) {
            OrgVO vo = voMap.get(o.getId());
            if (o.getParentId() == null) {
                roots.add(vo);
            } else {
                OrgVO parent = voMap.get(o.getParentId());
                if (parent != null) {
                    parent.getChildren().add(vo);
                } else {
                    roots.add(vo);
                }
            }
        }
        return roots;
    }

    @Override
    public List<Org> listAll() {
        return orgRepository.findAllByOrderByOrgLevelAscIdAsc();
    }

    @Override
    @Transactional
    public OrgVO create(Org org) {
        if (org.getCode() == null || org.getCode().trim().isEmpty()) {
            throw new BusinessException("请填写机构编码");
        }
        if (org.getName() == null || org.getName().trim().isEmpty()) {
            throw new BusinessException("请填写机构名称");
        }
        if (orgRepository.existsByCode(org.getCode().trim())) {
            throw new BusinessException("机构编码已存在");
        }
        String code = org.getCode().trim();
        String name = org.getName().trim();
        Integer level = org.getOrgLevel() == null ? 0 : org.getOrgLevel();
        Long parentId = org.getParentId();
        if (parentId != null) {
            Org parent = orgRepository.findById(parentId)
                    .orElseThrow(() -> new BusinessException(404, "上级机构不存在"));
            level = (parent.getOrgLevel() == null ? 0 : parent.getOrgLevel()) + 1;
            org.setPath(parent.getPath() == null ? "/" + parent.getId() + "/"
                    : parent.getPath() + parent.getId() + "/");
        } else {
            org.setPath("/");
        }
        org.setCode(code);
        org.setName(name);
        org.setOrgLevel(level);
        org.setStatus(org.getStatus() == null ? "enabled" : org.getStatus());
        return OrgVO.from(orgRepository.save(org));
    }

    @Override
    @Transactional
    public OrgVO update(Long id, Org org) {
        Org db = orgRepository.findById(id).orElseThrow(() -> new BusinessException(404, "机构不存在"));
        if (org.getName() != null && !org.getName().trim().isEmpty()) {
            db.setName(org.getName().trim());
        }
        if (org.getRemark() != null) db.setRemark(org.getRemark());
        if (org.getManagerId() != null) {
            db.setManagerId(org.getManagerId());
        }
        if (org.getManagerName() != null) db.setManagerName(org.getManagerName());
        if (org.getStatus() != null) db.setStatus(org.getStatus());
        return OrgVO.from(orgRepository.save(db));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Org org = orgRepository.findById(id).orElseThrow(() -> new BusinessException(404, "机构不存在"));
        boolean hasChild = orgRepository.findAll().stream().anyMatch(o -> id.equals(o.getParentId()));
        if (hasChild) {
            throw new BusinessException("请先删除下级机构");
        }
        orgRepository.deleteById(id);
    }

    @Override
    public Map<Long, String> idNameMap() {
        return orgRepository.findAll().stream()
                .collect(Collectors.toMap(Org::getId, Org::getName, (a, b) -> a, LinkedHashMap::new));
    }

    @Override
    public List<Long> visibleOrgIds() {
        User user = authService.getCurrentUser();
        if (user == null || user.getOrgId() == null) {
            return null;
        }
        Org org = orgRepository.findById(user.getOrgId()).orElse(null);
        if (org == null) {
            return null;
        }
        String path = org.getPath();
        String prefix = path;
        return orgRepository.findAll().stream()
                .filter(o -> o.getId().equals(org.getId())
                        || (o.getPath() != null && o.getPath().startsWith(prefix)
                            && o.getPath().length() > prefix.length()))
                .map(Org::getId)
                .collect(Collectors.toList());
    }

@Override
    public boolean visible(Long orgId) {
        if (orgId == null) return true;
        List<Long> scope = visibleOrgIds();
        return scope == null || scope.contains(orgId);
    }

    @Override
    public List<Long> orgAndDescendants(Long orgId) {
        if (orgId == null) return null;
        List<Long> result = new ArrayList<>();
        result.add(orgId);
        String prefix = "/" + orgId + "/";
        orgRepository.findAll().stream()
                .filter(o -> o.getPath() != null && o.getPath().startsWith(prefix))
                .forEach(o -> result.add(o.getId()));
        return result;
    }
}