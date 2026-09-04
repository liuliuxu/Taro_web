package com.heavymachinery.service;

import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.WorkOrderAssignRequest;
import com.heavymachinery.dto.WorkOrderCreateRequest;
import com.heavymachinery.dto.WorkOrderHandleRequest;
import com.heavymachinery.dto.WorkOrderVO;

import java.util.List;
import java.util.Map;

public interface WorkOrderService {

    WorkOrderVO create(WorkOrderCreateRequest request);

    WorkOrderVO getDetail(Long id);

    PageResult<WorkOrderVO> list(int page, int pageSize, String status, String keyword);

    /** 我报修的 */
    List<WorkOrderVO> listByReporter();

    /** 指派给我处理的 */
    List<WorkOrderVO> listMyAssigned();

    /** 待办（指派给我且未完成的） */
    List<WorkOrderVO> listMyTodos();

    /** 全部工单（管理端） */
    PageResult<WorkOrderVO> adminList(int page, int pageSize, String status, String keyword, Long assigneeUserId);

    /** 指派处理人 */
    WorkOrderVO assign(Long id, WorkOrderAssignRequest request);

    /** 处理/流转状态 */
    WorkOrderVO handle(Long id, WorkOrderHandleRequest request);

    Map<String, Long> stats();
}
