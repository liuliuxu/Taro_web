package com.heavymachinery.service;

import com.heavymachinery.dto.ApprovalSubmitRequest;
import com.heavymachinery.entity.ApprovalInstance;
import com.heavymachinery.entity.ApprovalTask;
import com.heavymachinery.entity.FormDefinition;
import com.heavymachinery.entity.OptionSet;
import com.heavymachinery.entity.ProcessDefinition;

import java.util.List;
import java.util.Map;

public interface ApprovalService {

    /* ===== 表单/选项集/流程（配置） ===== */
    OptionSet saveOptionSet(OptionSet optionSet);

    void deleteOptionSet(Long id);

    List<OptionSet> listOptionSets();

    FormDefinition saveForm(FormDefinition form);

    void deleteForm(Long id);

    List<FormDefinition> listForms();

    FormDefinition getForm(Long id);

    ProcessDefinition saveProcess(ProcessDefinition process);

    void deleteProcess(Long id);

    List<ProcessDefinition> listProcesses();

    /** 可发起审批的流程（已发布且绑定表单） */
    List<ProcessDefinition> listStartable();

    /* ===== 审批流转 ===== */
    ApprovalInstance submit(ApprovalSubmitRequest request);

    List<ApprovalInstance> listByApplicant();

    List<ApprovalInstance> listTodo();

    List<ApprovalInstance> listAll(Integer page, Integer pageSize, String status, String keyword);

    Map<String, Object> detail(Long instanceId);

    ApprovalInstance approve(Long instanceId, String comment);

    ApprovalInstance reject(Long instanceId, String comment);

    ApprovalInstance withdraw(Long instanceId, Long userId);

    List<ApprovalTask> tasksOfInstance(Long instanceId);
}