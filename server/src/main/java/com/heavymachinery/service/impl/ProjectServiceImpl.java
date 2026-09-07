package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.ProjectCreateRequest;
import com.heavymachinery.dto.ProjectVO;
import com.heavymachinery.entity.Project;
import com.heavymachinery.repository.ProjectRepository;
import com.heavymachinery.service.ProjectService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Override
    @Transactional
    public ProjectVO create(ProjectCreateRequest request) {
        Project p = new Project();
        apply(p, request);
        p.setProjectNo(generateProjectNo());
        return ProjectVO.from(projectRepository.save(p));
    }

    @Override
    @Transactional
    public ProjectVO update(Long id, ProjectCreateRequest request) {
        Project p = getProject(id);
        apply(p, request);
        return ProjectVO.from(projectRepository.save(p));
    }

    @Override
    public ProjectVO getDetail(Long id) {
        return ProjectVO.from(getProject(id));
    }

    @Override
    @Transactional
    public ProjectVO changeStatus(Long id, String status) {
        Project p = getProject(id);
        if (status == null || status.isEmpty()) {
            throw new BusinessException("请选择目标状态");
        }
        if (!List.of("created", "active", "finished", "cancelled").contains(status)) {
            throw new BusinessException("非法的工程状态: " + status);
        }
        p.setStatus(status);
        return ProjectVO.from(projectRepository.save(p));
    }

    @Override
    public PageResult<ProjectVO> list(int page, int pageSize, String status, String keyword) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());

        Specification<Project> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isEmpty()) {
                String kw = "%" + keyword + "%";
                predicates.add(cb.or(
                        cb.like(root.get("name"), kw),
                        cb.like(root.get("customerName"), kw),
                        cb.like(root.get("address"), kw)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Project> result = projectRepository.findAll(spec, pageable);
        List<ProjectVO> list = result.getContent().stream()
                .map(ProjectVO::from).collect(Collectors.toList());
        return new PageResult<>(list, result.getTotalElements(), page, pageSize);
    }

    private Project getProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "工程不存在"));
    }

    private void apply(Project p, ProjectCreateRequest r) {
        p.setName(r.getName());
        p.setCustomerName(r.getCustomerName());
        p.setCustomerPhone(r.getCustomerPhone());
        p.setAddress(r.getAddress());
        p.setPlannedStart(r.getPlannedStart());
        p.setPlannedEnd(r.getPlannedEnd());
        p.setBudget(r.getBudget());
        p.setDescription(r.getDescription());
        p.setManagerName(r.getManagerName());
    }

    private String generateProjectNo() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "PRJ" + time + rand;
    }
}