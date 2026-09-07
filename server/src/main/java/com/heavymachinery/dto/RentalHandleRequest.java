package com.heavymachinery.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 租赁合同操作请求（归还/取消）
 */
@Data
public class RentalHandleRequest {

    /** returned, cancelled */
    private String status;

    private LocalDate actualReturnDate;

    private BigDecimal totalAmount;

    private String note;
}