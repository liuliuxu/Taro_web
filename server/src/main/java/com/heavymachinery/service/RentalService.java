package com.heavymachinery.service;

import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.RentalContractCreateRequest;
import com.heavymachinery.dto.RentalHandleRequest;
import com.heavymachinery.dto.RentalVO;

import java.util.List;
import java.util.Map;

public interface RentalService {

    RentalVO create(RentalContractCreateRequest request, Long createdByUserId);

    RentalVO getDetail(Long id);

    PageResult<RentalVO> list(int page, int pageSize, String status, String keyword);

    List<RentalVO> listActive();

    RentalVO handle(Long id, RentalHandleRequest request);

    Map<String, Long> stats();
}