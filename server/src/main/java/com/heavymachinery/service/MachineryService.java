package com.heavymachinery.service;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.MachineryRequest;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.entity.Machinery;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MachineryService {

    PageResult<MachineryVO> list(int page, int pageSize, String category, String keyword, String status, String sort);

    MachineryVO getDetail(Long id);

    List<String> listCategories();

    List<MachineryVO> listRecommended();

    MachineryVO create(MachineryRequest request);

    MachineryVO update(Long id, MachineryRequest request);

    void delete(Long id);
}
