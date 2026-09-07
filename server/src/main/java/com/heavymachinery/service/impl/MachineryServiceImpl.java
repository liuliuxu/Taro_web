package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.MachineryRequest;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.service.MachineryService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MachineryServiceImpl implements MachineryService {

    private final MachineryRepository machineryRepository;

    public MachineryServiceImpl(MachineryRepository machineryRepository) {
        this.machineryRepository = machineryRepository;
    }

    @Override
    public PageResult<MachineryVO> list(int page, int pageSize, String category, String keyword, String status, String sort) {
        Sort sortSpec;
        if ("price_asc".equals(sort)) {
            sortSpec = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price_desc".equals(sort)) {
            sortSpec = Sort.by(Sort.Direction.DESC, "price");
        } else {
            sortSpec = Sort.by(Sort.Direction.DESC, "recommended").and(Sort.by("createdAt").descending());
        }
        Pageable pageable = PageRequest.of(page - 1, pageSize, sortSpec);

        Specification<Machinery> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (category != null && !category.isEmpty()) {
                predicates.add(cb.equal(root.get("category"), category));
            }
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isEmpty()) {
                String kw = "%" + keyword + "%";
                predicates.add(cb.or(
                        cb.like(root.get("name"), kw),
                        cb.like(root.get("model"), kw),
                        cb.like(root.get("brand"), kw)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Machinery> result = machineryRepository.findAll(spec, pageable);
        List<MachineryVO> list = result.getContent().stream()
                .map(MachineryVO::from)
                .collect(Collectors.toList());
        return new PageResult<>(list, result.getTotalElements(), page, pageSize);
    }

    @Override
    public MachineryVO getDetail(Long id) {
        Machinery machinery = machineryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "设备不存在"));
        return MachineryVO.from(machinery);
    }

    @Override
    public List<String> listCategories() {
        return machineryRepository.findDistinctCategories();
    }

    @Override
    public List<MachineryVO> listRecommended() {
        List<Machinery> list = machineryRepository.findByRecommendedTrue();
        if (list.isEmpty()) {
            list = machineryRepository.findAll(PageRequest.of(0, 5)).getContent();
        }
        return list.stream().map(MachineryVO::from).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MachineryVO create(MachineryRequest request) {
        Machinery m = new Machinery();
        apply(m, request);
        return MachineryVO.from(machineryRepository.save(m));
    }

    @Override
    @Transactional
    public MachineryVO update(Long id, MachineryRequest request) {
        Machinery m = machineryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "设备不存在"));
        apply(m, request);
        return MachineryVO.from(machineryRepository.save(m));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!machineryRepository.existsById(id)) {
            throw new BusinessException(404, "设备不存在");
        }
        machineryRepository.deleteById(id);
    }

    private void apply(Machinery m, MachineryRequest r) {
        m.setName(r.getName());
        m.setModel(r.getModel());
        m.setCategory(r.getCategory());
        m.setBrand(r.getBrand());
        m.setDescription(r.getDescription());
        if (r.getPrice() != null) m.setPrice(r.getPrice());
        if (r.getStock() != null) m.setStock(r.getStock());
        if (r.getStatus() != null) m.setStatus(r.getStatus());
        m.setImage(r.getImage());
        m.setSpecWeight(r.getSpecWeight());
        m.setSpecPower(r.getSpecPower());
        m.setSpecDimensions(r.getSpecDimensions());
        m.setSpecCapacity(r.getSpecCapacity());
        if (r.getRecommended() != null) m.setRecommended(r.getRecommended());
    }
}
