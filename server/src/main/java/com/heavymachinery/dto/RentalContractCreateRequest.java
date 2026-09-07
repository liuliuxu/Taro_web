package com.heavymachinery.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 新建租赁合同请求
 */
@Data
public class RentalContractCreateRequest {

    @NotNull
    private Long machineryId;

    @NotBlank
    private String clientCompany;

    private String clientContact;
    private String clientPhone;

    private BigDecimal deposit;
    private BigDecimal dailyRate;
    private LocalDate startDate;
    private LocalDate endDate;
    private String note;
}