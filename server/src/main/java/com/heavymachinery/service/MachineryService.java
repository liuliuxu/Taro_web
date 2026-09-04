package com.heavymachinery.service;

import com.heavymachinery.common.BusinessException;
import com.heavymachinery.common.PageResult;
import com.heavymachinery.dto.MachineryVO;
import com.heavymachinery.entity.Machinery;
import org.springframework.data.domain.Page;

import java.util.List;

public interface MachineryService {

    PageResult<MachineryVO> list(int page, int pageSize, String category, String keyword, String status);

    MachineryVO getDetail(Long id);

    List<String> listCategories();

    List<MachineryVO> listRecommended();
}
