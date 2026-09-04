package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.*;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.User;
import com.heavymachinery.entity.WorkOrder;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.repository.WorkOrderRepository;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.WorkOrderService;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class WorkOrderServiceImpl implements WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final MachineryRepository machineryRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    public WorkOrderServiceImpl(WorkOrderRepository workOrderRepository,
                                MachineryRepository machineryRepository,
                                UserRepository userRepository,
                                AuthService authService) {
        this.workOrderRepository = workOrderRepository;
        this.machineryRepository = machineryRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    @Override
    @Transactional
    public WorkOrderVO create(WorkOrderCreateRequest request) {
        Machinery machinery = machineryRepository.findById(request.getMachineryId())
                .orElseThrow(() -> new BusinessException(404, "设备不存在"));

        User current = authService.getCurrentUser();

        WorkOrder order = new WorkOrder();
        order.setWorkNo(generateWorkNo());
        order.setMachineryId(machinery.getId());
        order.setMachineryName(machinery.getName());
        order.setTitle(request.getTitle());
        order.setDescription(request.getDescription());
        order.setType("maintain".equals(request.getType()) ? "maintain" : "repair");
        order.setPriority(request.getPriority());
        order.setStatus("created");
        order.setReportUserId(current.getId());
        order.setReportUserName(current.getNickname() != null ? current.getNickname() : current.getUsername());
        order.setReportedAt(LocalDateTime.now());

        return WorkOrderVO.from(workOrderRepository.save(order));
    }

    @Override
    public WorkOrderVO getDetail(Long id) {
        WorkOrder order = workOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "工单不存在"));
        WorkOrderVO vo = WorkOrderVO.from(order);
        machineryRepository.findById(order.getMachineryId()).ifPresent(m -> {
            vo.setMachineryModel(m.getModel());
            vo.setMachineryCategory(m.getCategory());
        });
        return vo;
    }

    @Override
    public PageResult<WorkOrderVO> list(int page, int pageSize, String status, String keyword) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Specification<WorkOrder> spec = buildSpec(status, keyword, null);
        Page<WorkOrder> result = workOrderRepository.findAll(spec, pageable);
        return toPageResult(result, page, pageSize);
    }

    @Override
    public List<WorkOrderVO> listByReporter() {
        User current = authService.getCurrentUser();
        return workOrderRepository.findByReportUserIdOrderByCreatedAtDesc(current.getId())
                .stream().map(this::mapWithMachinery).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderVO> listMyAssigned() {
        User current = authService.getCurrentUser();
        return workOrderRepository.findByAssigneeUserIdOrderByCreatedAtDesc(current.getId())
                .stream().map(this::mapWithMachinery).collect(Collectors.toList());
    }

    @Override
    public List<WorkOrderVO> listMyTodos() {
        User current = authService.getCurrentUser();
        return workOrderRepository.findByAssigneeUserIdOrderByCreatedAtDesc(current.getId())
                .stream()
                .filter(o -> !"done".equals(o.getStatus()) && !"cancelled".equals(o.getStatus()))
                .map(this::mapWithMachinery).collect(Collectors.toList());
    }

    @Override
    public PageResult<WorkOrderVO> adminList(int page, int pageSize, String status, String keyword, Long assigneeUserId) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Specification<WorkOrder> spec = buildSpec(status, keyword, assigneeUserId);
        Page<WorkOrder> result = workOrderRepository.findAll(spec, pageable);
        return toPageResult(result, page, pageSize);
    }

    @Override
    @Transactional
    public WorkOrderVO assign(Long id, WorkOrderAssignRequest request) {
        WorkOrder order = getOrder(id);
        User assignee = userRepository.findById(request.getAssigneeUserId())
                .orElseThrow(() -> new BusinessException(404, "处理人不存在"));

        String target = request.getStatus() == null ? "assigned" : request.getStatus();

        order.setAssigneeUserId(assignee.getId());
        order.setAssigneeName(assignee.getNickname() != null ? assignee.getNickname() : assignee.getUsername());
        order.setStatus(target);
        if (request.getHandleNote() != null) {
            order.setHandleNote(request.getHandleNote());
        }
        return WorkOrderVO.from(workOrderRepository.save(order));
    }

    @Override
    @Transactional
    public WorkOrderVO handle(Long id, WorkOrderHandleRequest request) {
        WorkOrder order = getOrder(id);
        validateTransition(order.getStatus(), request.getStatus());

        if ("cancelled".equals(request.getStatus())) {
            order.setStatus("cancelled");
        } else {
            order.setStatus(request.getStatus());
        }
        if (request.getHandleNote() != null) {
            order.setHandleNote(request.getHandleNote());
        }
        if (request.getCost() != null) {
            order.setCost(request.getCost());
        }
        if ("done".equals(order.getStatus())) {
            order.setCompletedAt(LocalDateTime.now());
        }
        return WorkOrderVO.from(workOrderRepository.save(order));
    }

    @Override
    public Map<String, Long> stats() {
        Map<String, Long> map = new LinkedHashMap<>();
        map.put("created", workOrderRepository.countByStatus("created"));
        map.put("assigned", workOrderRepository.countByStatus("assigned"));
        map.put("processing", workOrderRepository.countByStatus("processing"));
        map.put("review", workOrderRepository.countByStatus("review"));
        map.put("done", workOrderRepository.countByStatus("done"));
        map.put("total", workOrderRepository.count());
        map.put("myTodos", (long) listMyTodos().size());
        return map;
    }

    // ---------- helpers ----------

    private WorkOrder getOrder(Long id) {
        return workOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "工单不存在"));
    }

    private PageResult<WorkOrderVO> toPageResult(Page<WorkOrder> result, int page, int pageSize) {
        List<WorkOrderVO> list = result.getContent().stream()
                .map(this::mapWithMachinery).collect(Collectors.toList());
        return new PageResult<>(list, result.getTotalElements(), page, pageSize);
    }

    private WorkOrderVO mapWithMachinery(WorkOrder o) {
        WorkOrderVO vo = WorkOrderVO.from(o);
        machineryRepository.findById(o.getMachineryId()).ifPresent(m -> {
            vo.setMachineryModel(m.getModel());
            vo.setMachineryCategory(m.getCategory());
        });
        return vo;
    }

    private Specification<WorkOrder> buildSpec(String status, String keyword, Long assigneeUserId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (assigneeUserId != null) {
                predicates.add(cb.equal(root.get("assigneeUserId"), assigneeUserId));
            }
            if (keyword != null && !keyword.isEmpty()) {
                String kw = "%" + keyword + "%";
                predicates.add(cb.or(
                        cb.like(root.get("title"), kw),
                        cb.like(root.get("workNo"), kw),
                        cb.like(root.get("machineryName"), kw)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private void validateTransition(String from, String to) {
        if (to == null || to.isEmpty()) {
            throw new BusinessException("请选择目标状态");
        }
        if ("cancelled".equals(to)) {
            return; // 任意状态可取消
        }
        Map<String, List<String>> allowed = Map.of(
                "created", List.of("assigned", "processing"),
                "assigned", List.of("processing", "review"),
                "processing", List.of("review", "done"),
                "review", List.of("done", "processing")
        );
        List<String> next = allowed.getOrDefault(from, List.of());
        if (!next.contains(to)) {
            throw new BusinessException("非法的状态流转: " + statusLabel(from) + " -> " + statusLabel(to));
        }
    }

    private String statusLabel(String s) {
        Map<String, String> labels = Map.of(
                "created", "待派单", "assigned", "待处理", "processing", "处理中",
                "review", "待验收", "done", "已完成", "cancelled", "已取消");
        return labels.getOrDefault(s, s);
    }

    private String generateWorkNo() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "WO" + time + rand;
    }
}
