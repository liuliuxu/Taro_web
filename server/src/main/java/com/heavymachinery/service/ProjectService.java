package com.heavymachinery.service;

import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.ProjectCreateRequest;
import com.heavymachinery.dto.ProjectVO;

public interface ProjectService {

    ProjectVO create(ProjectCreateRequest request);

    ProjectVO update(Long id, ProjectCreateRequest request);

    ProjectVO getDetail(Long id);

    ProjectVO changeStatus(Long id, String status);

    PageResult<ProjectVO> list(int page, int pageSize, String status, String keyword);
}