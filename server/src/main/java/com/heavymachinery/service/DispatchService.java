package com.heavymachinery.service;

import com.heavymachinery.dto.DispatchTaskCreateRequest;
import com.heavymachinery.dto.DispatchTaskHandleRequest;
import com.heavymachinery.dto.DispatchTaskVO;

import java.util.List;
import java.util.Map;

public interface DispatchService {

    DispatchTaskVO create(DispatchTaskCreateRequest request, Long operatorUserId);

    DispatchTaskVO assign(Long id, Long assigneeUserId);

    DispatchTaskVO getDetail(Long id);

    List<DispatchTaskVO> listByProject(Long projectId);

    List<DispatchTaskVO> myTasks(Long userId);

    List<DispatchTaskVO> listAll(String status);

    DispatchTaskVO handle(Long id, DispatchTaskHandleRequest request);

    Map<String, Long> stats();
}