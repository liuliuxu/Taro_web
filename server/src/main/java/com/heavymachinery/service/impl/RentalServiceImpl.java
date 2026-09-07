package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.RentalContractCreateRequest;
import com.heavymachinery.dto.RentalHandleRequest;
import com.heavymachinery.dto.RentalVO;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.RentalContract;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.RentalContractRepository;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.service.RentalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class RentalServiceImpl implements RentalService {

    private final RentalContractRepository rentalContractRepository;
    private final MachineryRepository machineryRepository;
    private final UserRepository userRepository;

    public RentalServiceImpl(RentalContractRepository rentalContractRepository,
                             MachineryRepository machineryRepository,
                             UserRepository userRepository) {
        this.rentalContractRepository = rentalContractRepository;
        this.machineryRepository = machineryRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public RentalVO create(RentalContractCreateRequest request, Long createdByUserId) {
        Machinery machinery = machineryRepository.findById(request.getMachineryId())
                .orElseThrow(() -> new BusinessException(404, "设备不存在"));

        RentalContract c = new RentalContract();
        c.setContractNo(generateContractNo());
        c.setMachineryId(machinery.getId());
        c.setMachineryName(machinery.getName());
        c.setMachineryModel(machinery.getModel());
        c.setClientCompany(request.getClientCompany());
        c.setClientContact(request.getClientContact());
        c.setClientPhone(request.getClientPhone());
        c.setDeposit(request.getDeposit());
        c.setDailyRate(request.getDailyRate());
        c.setStartDate(request.getStartDate());
        c.setEndDate(request.getEndDate());
        c.setNote(request.getNote());
        computeAmount(c);
        userRepository.findById(createdByUserId).ifPresent(u ->
                c.setCreatedByName(u.getNickname() != null ? u.getNickname() : u.getUsername()));
        c.setCreatedByUserId(createdByUserId);

        if ("available".equals(machinery.getStatus())) {
            machinery.setStatus("rented");
            machineryRepository.save(machinery);
        }
        return RentalVO.from(rentalContractRepository.save(c));
    }

    @Override
    public RentalVO getDetail(Long id) {
        return RentalVO.from(getContract(id));
    }

    @Override
    public PageResult<RentalVO> list(int page, int pageSize, String status, String keyword) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by("createdAt").descending());

        Specification<RentalContract> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (keyword != null && !keyword.isEmpty()) {
                String kw = "%" + keyword + "%";
                predicates.add(cb.or(
                        cb.like(root.get("clientCompany"), kw),
                        cb.like(root.get("machineryName"), kw),
                        cb.like(root.get("contractNo"), kw)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<RentalContract> result = rentalContractRepository.findAll(spec, pageable);
        List<RentalVO> list = result.getContent().stream()
                .map(RentalVO::from).collect(Collectors.toList());
        return new PageResult<>(list, result.getTotalElements(), page, pageSize);
    }

    @Override
    public List<RentalVO> listActive() {
        return rentalContractRepository.findByStatusOrderByCreatedAtDesc("active").stream()
                .map(RentalVO::from).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RentalVO handle(Long id, RentalHandleRequest request) {
        RentalContract c = getContract(id);
        String status = request.getStatus();
        if (status == null || status.isEmpty()) {
            throw new BusinessException("请选择操作类型");
        }
        if ("returned".equals(status)) {
            if ("active".equals(c.getStatus())) {
                c.setActualReturnDate(request.getActualReturnDate() != null
                        ? request.getActualReturnDate() : LocalDate.now());
                if (request.getTotalAmount() != null) {
                    c.setTotalAmount(request.getTotalAmount());
                } else if (c.getRentDays() != null && c.getDailyRate() != null) {
                    long days = ChronoUnit.DAYS.between(c.getStartDate(), c.getActualReturnDate());
                    c.setTotalAmount(c.getDailyRate().multiply(BigDecimal.valueOf(Math.max(days, 1))));
                }
                c.setStatus("returned");
                machineryRepository.findById(c.getMachineryId()).ifPresent(m -> {
                    m.setStatus("available");
                    machineryRepository.save(m);
                });
            }
        } else if ("cancelled".equals(status)) {
            if ("active".equals(c.getStatus())) {
                c.setStatus("cancelled");
                machineryRepository.findById(c.getMachineryId()).ifPresent(m -> {
                    if ("rented".equals(m.getStatus())) {
                        m.setStatus("available");
                        machineryRepository.save(m);
                    }
                });
            }
        } else {
            throw new BusinessException("非法的操作: " + status);
        }
        if (request.getNote() != null) {
            c.setNote(request.getNote());
        }
        return RentalVO.from(rentalContractRepository.save(c));
    }

    @Override
    public Map<String, Long> stats() {
        Map<String, Long> map = new LinkedHashMap<>();
        map.put("active", rentalContractRepository.countByStatus("active"));
        map.put("returned", rentalContractRepository.countByStatus("returned"));
        map.put("cancelled", rentalContractRepository.countByStatus("cancelled"));
        map.put("total", rentalContractRepository.count());
        return map;
    }

    private RentalContract getContract(Long id) {
        return rentalContractRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "租赁合同不存在"));
    }

    private void computeAmount(RentalContract c) {
        if (c.getStartDate() != null && c.getEndDate() != null) {
            long days = ChronoUnit.DAYS.between(c.getStartDate(), c.getEndDate());
            c.setRentDays((int) Math.max(days, 1));
            if (c.getDailyRate() != null) {
                c.setTotalAmount(c.getDailyRate().multiply(BigDecimal.valueOf(Math.max(days, 1))));
            }
        }
    }

    private String generateContractNo() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "HT" + time + rand;
    }
}