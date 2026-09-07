package com.heavymachinery.service.impl;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.dto.ApprovalSubmitRequest;
import com.heavymachinery.entity.*;
import com.heavymachinery.repository.*;
import com.heavymachinery.service.ApprovalService;
import com.heavymachinery.service.AuthService;
import com.heavymachinery.service.OrgService;
import com.heavymachinery.util.JsonUtil;
import com.heavymachinery.util.OrgSpecs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

/**
 * 审批引擎：动态表单 + 多级审批流 + 业务回调
 */
@Service
public class ApprovalServiceImpl implements ApprovalService {

    private final OptionSetRepository optionSetRepository;
    private final FormDefinitionRepository formDefinitionRepository;
    private final ProcessDefinitionRepository processDefinitionRepository;
    private final ApprovalInstanceRepository instanceRepository;
    private final ApprovalTaskRepository taskRepository;
    private final UserRepository userRepository;
    private final WorkOrderRepository workOrderRepository;
    private final RentalContractRepository rentalContractRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final MachineryRepository machineryRepository;
    private final OrgService orgService;
    private final AuthService authService;

    public ApprovalServiceImpl(OptionSetRepository optionSetRepository,
                               FormDefinitionRepository formDefinitionRepository,
                               ProcessDefinitionRepository processDefinitionRepository,
                               ApprovalInstanceRepository instanceRepository,
                               ApprovalTaskRepository taskRepository,
                               UserRepository userRepository,
                               WorkOrderRepository workOrderRepository,
                               RentalContractRepository rentalContractRepository,
                               PurchaseOrderRepository purchaseOrderRepository,
                               MachineryRepository machineryRepository,
                               OrgService orgService,
                               AuthService authService) {
        this.optionSetRepository = optionSetRepository;
        this.formDefinitionRepository = formDefinitionRepository;
        this.processDefinitionRepository = processDefinitionRepository;
        this.instanceRepository = instanceRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.workOrderRepository = workOrderRepository;
        this.rentalContractRepository = rentalContractRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.machineryRepository = machineryRepository;
        this.orgService = orgService;
        this.authService = authService;
    }

    /* ===== 配置 ===== */

    @Override
    @Transactional
    public OptionSet saveOptionSet(OptionSet optionSet) {
        if (optionSet.getId() == null && optionSetRepository.existsByCode(optionSet.getCode())) {
            throw new BusinessException(400, "选项集编码已存在");
        }
        if (optionSet.getStatus() == null) optionSet.setStatus("enabled");
        return optionSetRepository.save(optionSet);
    }

    @Override
    @Transactional
    public void deleteOptionSet(Long id) {
        optionSetRepository.deleteById(id);
    }

    @Override
    public List<OptionSet> listOptionSets() {
        return optionSetRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Override
    @Transactional
    public FormDefinition saveForm(FormDefinition form) {
        if (form.getStatus() == null) form.setStatus("enabled");
        return formDefinitionRepository.save(form);
    }

    @Override
    @Transactional
    public void deleteForm(Long id) {
        formDefinitionRepository.deleteById(id);
    }

    @Override
    public List<FormDefinition> listForms() {
        return formDefinitionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Override
    public FormDefinition getForm(Long id) {
        return formDefinitionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "表单不存在"));
    }

    @Override
    @Transactional
    public ProcessDefinition saveProcess(ProcessDefinition process) {
        if (process.getStatus() == null) process.setStatus("draft");
        return processDefinitionRepository.save(process);
    }

    @Override
    @Transactional
    public void deleteProcess(Long id) {
        processDefinitionRepository.deleteById(id);
    }

    @Override
    public List<ProcessDefinition> listProcesses() {
        return processDefinitionRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    @Override
    public List<ProcessDefinition> listStartable() {
        return processDefinitionRepository.findByStatusOrderByCreatedAtDesc("published").stream()
                .filter(p -> p.getFormId() != null)
                .collect(Collectors.toList());
    }

    /* ===== 流转 ===== */

    @Override
    @Transactional
    public ApprovalInstance submit(ApprovalSubmitRequest request) {
        ProcessDefinition process = processDefinitionRepository.findById(request.getProcessId())
                .orElseThrow(() -> new BusinessException(404, "审批流程不存在"));
        if (!"published".equals(process.getStatus())) {
            throw new BusinessException(400, "该流程未发布，不能发起审批");
        }
        FormDefinition form = formDefinitionRepository.findById(process.getFormId())
                .orElseThrow(() -> new BusinessException(404, "表单定义不存在"));

        User applicant = authService.getCurrentUser();
        if (applicant == null) throw new BusinessException(401, "未登录");

        List<Map<String, Object>> nodes = JsonUtil.toListMap(process.getNodesJson());
        if (nodes.isEmpty()) throw new BusinessException(400, "流程未配置审批节点");

        ApprovalInstance instance = new ApprovalInstance();
        instance.setApprovalNo(genNo());
        instance.setProcessId(process.getId());
        instance.setFormId(form.getId());
        String bizType = request.getBizType() != null ? request.getBizType() : form.getBizType();
        instance.setBizType(bizType);
        instance.setBizId(request.getBizId());
        instance.setTitle(request.getTitle() != null && !request.getTitle().isEmpty()
                ? request.getTitle() : (process.getName() + "申请"));
        instance.setFormDataJson(JsonUtil.toJson(request.getFormData() != null ? request.getFormData() : new HashMap<>()));
        instance.setStatus("pending");
        instance.setApplicantId(applicant.getId());
        instance.setApplicantName(applicant.getNickname() != null ? applicant.getNickname() : applicant.getUsername());
        instance.setOrgId(applicant.getOrgId());
        instance.setCurrentNodeIndex(0);
        instance.setCurrentNodeName((String) nodes.get(0).get("name"));
        instance = instanceRepository.save(instance);

        for (Map<String, Object> node : nodes) {
            ApprovalTask task = new ApprovalTask();
            task.setInstanceId(instance.getId());
            int idx = ((Number) node.get("index")).intValue();
            task.setNodeIndex(idx);
            task.setNodeName((String) node.get("name"));
            task.setStatus("pending");
            List<Long> candidates = resolveCandidates(instance, node);
            task.setCandidateIdsJson(JsonUtil.toJson(candidates));
            taskRepository.save(task);
        }
        return instance;
    }

    /** 按审批人类型解析候选用户 */
    private List<Long> resolveCandidates(ApprovalInstance instance, Map<String, Object> node) {
        String approverType = (String) node.get("approverType");
        List<Long> scope = orgService.orgAndDescendants(instance.getOrgId());
        List<User> pool;
        if ("role".equals(approverType)) {
            pool = userRepository.findByRole((String) node.get("approverValue"));
        } else if ("org".equals(approverType)) {
            Long orgId = Long.valueOf(String.valueOf(node.get("approverValue")));
            List<Long> ids = orgService.orgAndDescendants(orgId);
            pool = ids == null ? userRepository.findAll()
                    : (ids.isEmpty() ? new ArrayList<>()
                    : userRepository.findAll().stream().filter(u -> ids.contains(u.getOrgId())).collect(Collectors.toList()));
        } else {
            // user: 逗号分隔用户id
            pool = new ArrayList<>();
            for (String idStr : String.valueOf(node.get("approverValue")).split(",")) {
                userRepository.findById(Long.valueOf(idStr.trim())).ifPresent(pool::add);
            }
        }
        return pool.stream()
                .filter(u -> scope == null || u.getOrgId() == null || scope.contains(u.getOrgId()))
                .map(User::getId)
                .collect(Collectors.toList());
    }

    private boolean isCandidate(ApprovalTask task, Long userId) {
        List<Long> candidates = JsonUtil.toLongList(task.getCandidateIdsJson());
        return candidates.isEmpty() || candidates.contains(userId);
    }

    @Override
    public List<ApprovalInstance> listByApplicant() {
        User u = authService.getCurrentUser();
        return u == null ? new ArrayList<>()
                : instanceRepository.findByApplicantIdOrderByCreatedAtDesc(u.getId());
    }

    @Override
    public List<ApprovalInstance> listTodo() {
        User u = authService.getCurrentUser();
        if (u == null) return new ArrayList<>();
        List<ApprovalInstance> result = new ArrayList<>();
        for (ApprovalInstance instance : instanceRepository.findByStatusOrderByCreatedAtDesc("pending")) {
            if (!orgService.visible(instance.getOrgId())) continue;
            Optional<ApprovalTask> current = taskRepository.findByInstanceIdOrderByNodeIndexAsc(instance.getId())
                    .stream().filter(t -> t.getNodeIndex().equals(instance.getCurrentNodeIndex()))
                    .findFirst();
            if (current.isPresent() && "pending".equals(current.get().getStatus()) && isCandidate(current.get(), u.getId())) {
                result.add(instance);
            }
        }
        return result;
    }

    @Override
    public List<ApprovalInstance> listAll(Integer page, Integer pageSize, String status, String keyword) {
        Specification<ApprovalInstance> spec = (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();
            if (status != null && !status.isEmpty()) ps.add(cb.equal(root.get("status"), status));
            if (keyword != null && !keyword.isEmpty()) {
                ps.add(cb.or(cb.like(root.get("title"), "%" + keyword + "%"),
                        cb.like(root.get("approvalNo"), "%" + keyword + "%")));
            }
            return cb.and(ps.toArray(new Predicate[0]));
        };
        Page<ApprovalInstance> result = instanceRepository.findAll(
                OrgSpecs.withOrg(spec, orgService.visibleOrgIds()),
                PageRequest.of(page != null ? page : 0,
                        Math.min(pageSize != null ? pageSize : 20, 100),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
        return new ArrayList<>(result.getContent());
    }

    @Override
    public Map<String, Object> detail(Long instanceId) {
        ApprovalInstance instance = instanceRepository.findById(instanceId)
                .orElseThrow(() -> new BusinessException(404, "审批不存在"));
        if (!orgService.visible(instance.getOrgId())) {
            throw new BusinessException(403, "无权访问该机构的数据");
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("instance", instance);
        result.put("form", formDefinitionRepository.findById(instance.getFormId()).orElse(null));
        result.put("tasks", taskRepository.findByInstanceIdOrderByNodeIndexAsc(instanceId));
        result.put("formData", JsonUtil.toMap(instance.getFormDataJson()));
        return result;
    }

    @Override
    @Transactional
    public ApprovalInstance approve(Long instanceId, String comment) {
        User u = authService.getCurrentUser();
        ApprovalInstance instance = getInstance(instanceId);
        if (!"pending".equals(instance.getStatus())) {
            throw new BusinessException(400, "该审批已结束，不能处理");
        }
        final int curNode = instance.getCurrentNodeIndex() != null ? instance.getCurrentNodeIndex() : 0;
        List<ApprovalTask> tasks = taskRepository.findByInstanceIdOrderByNodeIndexAsc(instanceId);
        ApprovalTask current = tasks.stream()
                .filter(t -> t.getNodeIndex().equals(curNode))
                .findFirst().orElseThrow(() -> new BusinessException(400, "当前节点任务不存在"));
        if (!isCandidate(current, u.getId())) {
            throw new BusinessException(403, "您不是当前节点的审批人");
        }
        current.setStatus("approved");
        current.setHandledById(u.getId());
        current.setHandledByName(u.getNickname() != null ? u.getNickname() : u.getUsername());
        current.setComment(comment);
        current.setHandledAt(LocalDateTime.now());
        taskRepository.save(current);

        int next = current.getNodeIndex() + 1;
        Optional<ApprovalTask> nextTask = tasks.stream().filter(t -> t.getNodeIndex().equals(next)).findFirst();
        if (nextTask.isPresent()) {
            instance.setCurrentNodeIndex(next);
            instance.setCurrentNodeName(nextTask.get().getNodeName());
            return instanceRepository.save(instance);
        }
        instance.setStatus("approved");
        instance.setFinishedAt(LocalDateTime.now());
        instance.setResultNote(comment);
        instance = instanceRepository.save(instance);
        handleBizApproved(instance);
        return instance;
    }

    @Override
    @Transactional
    public ApprovalInstance reject(Long instanceId, String comment) {
        User u = authService.getCurrentUser();
        ApprovalInstance instance = getInstance(instanceId);
        if (!"pending".equals(instance.getStatus())) {
            throw new BusinessException(400, "该审批已结束，不能处理");
        }
        final int curNode = instance.getCurrentNodeIndex() != null ? instance.getCurrentNodeIndex() : 0;
        List<ApprovalTask> tasks = taskRepository.findByInstanceIdOrderByNodeIndexAsc(instanceId);
        ApprovalTask current = tasks.stream()
                .filter(t -> t.getNodeIndex().equals(curNode))
                .findFirst().orElseThrow(() -> new BusinessException(400, "当前节点任务不存在"));
        if (!isCandidate(current, u.getId())) {
            throw new BusinessException(403, "您不是当前节点的审批人");
        }
        current.setStatus("rejected");
        current.setHandledById(u.getId());
        current.setHandledByName(u.getNickname() != null ? u.getNickname() : u.getUsername());
        current.setComment(comment);
        current.setHandledAt(LocalDateTime.now());
        taskRepository.save(current);

        instance.setStatus("rejected");
        instance.setFinishedAt(LocalDateTime.now());
        instance.setResultNote(comment);
        return instanceRepository.save(instance);
    }

    @Override
    @Transactional
    public ApprovalInstance withdraw(Long instanceId, Long userId) {
        ApprovalInstance instance = getInstance(instanceId);
        if (!instance.getApplicantId().equals(userId)) {
            throw new BusinessException(403, "只有申请人才可撤回");
        }
        if (!"pending".equals(instance.getStatus())) {
            throw new BusinessException(400, "该审批已结束，不能撤回");
        }
        ApprovalTask current = taskRepository.findByInstanceIdOrderByNodeIndexAsc(instanceId).stream()
                .filter(t -> t.getNodeIndex().equals(instance.getCurrentNodeIndex()))
                .findFirst().orElse(null);
        if (current != null && current.getHandledById() != null) {
            throw new BusinessException(400, "当前节点已处理，不能撤回");
        }
        instance.setStatus("withdrawn");
        instance.setFinishedAt(LocalDateTime.now());
        return instanceRepository.save(instance);
    }

    @Override
    public List<ApprovalTask> tasksOfInstance(Long instanceId) {
        return taskRepository.findByInstanceIdOrderByNodeIndexAsc(instanceId);
    }

    private ApprovalInstance getInstance(Long id) {
        return instanceRepository.findById(id)
                .orElseThrow(() -> new BusinessException(404, "审批不存在"));
    }

    /** 审批通过后的业务回调 */
    private void handleBizApproved(ApprovalInstance instance) {
        if ("purchase".equals(instance.getBizType()) && instance.getBizId() != null) {
            purchaseOrderRepository.findById(instance.getBizId()).ifPresent(p ->
                    p.setStatus("approved"));
        } else if ("rental".equals(instance.getBizType()) && instance.getBizId() != null) {
            rentalContractRepository.findById(instance.getBizId()).ifPresent(r ->
                    r.setStatus("active"));
        } else if ("workorder_cost".equals(instance.getBizType()) && instance.getBizId() != null) {
            workOrderRepository.findById(instance.getBizId()).ifPresent(w ->
                    w.setStatus("approved"));
        } else if ("disposal".equals(instance.getBizType()) && instance.getBizId() != null) {
            machineryRepository.findById(instance.getBizId()).ifPresent(m ->
                    m.setStatus("disposed"));
        }
    }

    private String genNo() {
        return "AP" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + ThreadLocalRandom.current().nextInt(100, 999);
    }
}