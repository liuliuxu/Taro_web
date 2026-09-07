package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.dto.DispatchTaskCreateRequest;
import com.heavymachinery.dto.DispatchTaskHandleRequest;
import com.heavymachinery.dto.DispatchTaskVO;
import com.heavymachinery.entity.DispatchTask;
import com.heavymachinery.entity.Machinery;
import com.heavymachinery.entity.Project;
import com.heavymachinery.entity.User;
import com.heavymachinery.repository.DispatchTaskRepository;
import com.heavymachinery.repository.MachineryRepository;
import com.heavymachinery.repository.ProjectRepository;
import com.heavymachinery.repository.UserRepository;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.service.DispatchService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class DispatchServiceImpl implements DispatchService {

    private final DispatchTaskRepository dispatchTaskRepository;
    private final ProjectRepository projectRepository;
    private final MachineryRepository machineryRepository;
    private final UserRepository userRepository;
    private final OrgService orgService;

    public DispatchServiceImpl(DispatchTaskRepository dispatchTaskRepository,
                               ProjectRepository projectRepository,
                               MachineryRepository machineryRepository,
                               UserRepository userRepository,
                              OrgService orgService) {
        this.dispatchTaskRepository = dispatchTaskRepository;
        this.projectRepository = projectRepository;
        this.machineryRepository = machineryRepository;
        this.userRepository = userRepository;
        this.orgService = orgService;
    }

    @Override
    @Transactional
    public DispatchTaskVO create(DispatchTaskCreateRequest request, Long operatorUserId) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new BusinessException(404, "工程不存在"));
        Machinery machinery = machineryRepository.findById(request.getMachineryId())
                .orElseThrow(() -> new BusinessException(404, "设备不存在"));

        DispatchTask task = new DispatchTask();
        task.setDispatchNo(generateDispatchNo());
        task.setProjectId(project.getId());
        task.setProjectName(project.getName());
        task.setOrgId(project.getOrgId());
        task.setMachineryId(machinery.getId());
        task.setMachineryName(machinery.getName());
        task.setMachineryModel(machinery.getModel());
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStartAt(request.getStartAt());
        task.setEndAt(request.getEndAt());
        if (request.getAssigneeUserId() != null) {
            userRepository.findById(request.getAssigneeUserId())
                    .ifPresent(u -> {
                        task.setAssigneeUserId(u.getId());
                        task.setAssigneeName(u.getNickname() != null ? u.getNickname() : u.getUsername());
                        task.setStatus("assigned");
                    });
        }
        return DispatchTaskVO.from(dispatchTaskRepository.save(task));
    }

    @Override
    @Transactional
    public DispatchTaskVO assign(Long id, Long assigneeUserId) {
        DispatchTask task = getTask(id);
        User assignee = userRepository.findById(assigneeUserId)
                .orElseThrow(() -> new BusinessException(404, "执行人不存在"));
        task.setAssigneeUserId(assignee.getId());
        task.setAssigneeName(assignee.getNickname() != null ? assignee.getNickname() : assignee.getUsername());
        task.setStatus("assigned");
        return DispatchTaskVO.from(dispatchTaskRepository.save(task));
    }

    @Override
    public DispatchTaskVO getDetail(Long id) {
        return DispatchTaskVO.from(getTask(id));
    }

    @Override
    public List<DispatchTaskVO> listByProject(Long projectId) {
        projectRepository.findById(projectId).ifPresent(p -> {
            if (!orgService.visible(p.getOrgId())) {
                throw new BusinessException(403, "无权访问该机构的数据");
            }
        });
        return dispatchTaskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(DispatchTaskVO::from).collect(Collectors.toList());
    }

    @Override
    public List<DispatchTaskVO> myTasks(Long userId) {
        return dispatchTaskRepository
                .findByAssigneeUserIdAndStatusInOrderByCreatedAtDesc(userId, List.of("assigned", "ongoing"))
                .stream().map(DispatchTaskVO::from).collect(Collectors.toList());
    }

    @Override
    public List<DispatchTaskVO> listAll(String status) {
        List<Long> scope = orgService.visibleOrgIds();
        java.util.function.BiPredicate<DispatchTask, List<Long>> vis = (t, sc) ->
                sc == null || t.getOrgId() == null || sc.contains(t.getOrgId());
        return dispatchTaskRepository.findAll().stream()
                .filter(t -> status == null || status.isEmpty() || status.equals(t.getStatus()))
                .filter(t -> vis.test(t, scope))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(DispatchTaskVO::from).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DispatchTaskVO handle(Long id, DispatchTaskHandleRequest request) {
        DispatchTask task = getTask(id);
        String from = task.getStatus();
        String to = request.getStatus();
        if (to == null || to.isEmpty()) {
            throw new BusinessException("请选择目标状态");
        }
        if ("cancelled".equals(to)) {
            if ("done".equals(from)) {
                throw new BusinessException("已完成的任务不能取消");
            }
            task.setStatus("cancelled");
        } else if ("assigned".equals(to)) {
            if (!"created".equals(from)) {
                throw new BusinessException("非法的状态流转");
            }
            if (request.getAssigneeUserId() != null) {
                userRepository.findById(request.getAssigneeUserId()).ifPresent(u -> {
                    task.setAssigneeUserId(u.getId());
                    task.setAssigneeName(u.getNickname() != null ? u.getNickname() : u.getUsername());
                });
            }
            task.setStatus("assigned");
        } else if ("ongoing".equals(to)) {
            if (!"assigned".equals(from) && !"created".equals(from)) {
                throw new BusinessException("非法的状态流转");
            }
            task.setStatus("ongoing");
        } else if ("done".equals(to)) {
            if (!"ongoing".equals(from) && !"assigned".equals(from)) {
                throw new BusinessException("非法的状态流转");
            }
            task.setStatus("done");
            if (task.getProgress() == null || task.getProgress() < 100) {
                task.setProgress(100);
            }
        } else {
            throw new BusinessException("非法的目标状态: " + to);
        }
        if (request.getProgress() != null) {
            task.setProgress(Math.min(100, Math.max(0, request.getProgress())));
        }
        if (request.getHandleNote() != null) {
            task.setHandleNote(request.getHandleNote());
        }
        return DispatchTaskVO.from(dispatchTaskRepository.save(task));
    }

    @Override
    public Map<String, Long> stats() {
        Map<String, Long> map = new LinkedHashMap<>();
        map.put("created", dispatchTaskRepository.countByStatus("created"));
        map.put("assigned", dispatchTaskRepository.countByStatus("assigned"));
        map.put("ongoing", dispatchTaskRepository.countByStatus("ongoing"));
        map.put("done", dispatchTaskRepository.countByStatus("done"));
        map.put("total", dispatchTaskRepository.count());
        return map;
    }

    private DispatchTask getTask(Long id) {
        return dispatchTaskRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "调度任务不存在"));
    }

    private String generateDispatchNo() {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "DP" + time + rand;
    }
}