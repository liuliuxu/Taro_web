package com.heavymachinery.dto;

import com.heavymachinery.entity.RentalContract;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class RentalVO {

    private Long id;
    private String contractNo;
    private Long machineryId;
    private String machineryName;
    private String machineryModel;
    private String clientCompany;
    private String clientContact;
    private String clientPhone;
    private BigDecimal deposit;
    private BigDecimal dailyRate;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer rentDays;
    private BigDecimal totalAmount;
    private String status;
    private LocalDate actualReturnDate;
    private String note;
    private Long createdByUserId;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static RentalVO from(RentalContract c) {
        RentalVO vo = new RentalVO();
        vo.setId(c.getId());
        vo.setContractNo(c.getContractNo());
        vo.setMachineryId(c.getMachineryId());
        vo.setMachineryName(c.getMachineryName());
        vo.setMachineryModel(c.getMachineryModel());
        vo.setClientCompany(c.getClientCompany());
        vo.setClientContact(c.getClientContact());
        vo.setClientPhone(c.getClientPhone());
        vo.setDeposit(c.getDeposit());
        vo.setDailyRate(c.getDailyRate());
        vo.setStartDate(c.getStartDate());
        vo.setEndDate(c.getEndDate());
        vo.setRentDays(c.getRentDays());
        vo.setTotalAmount(c.getTotalAmount());
        vo.setStatus(c.getStatus());
        vo.setActualReturnDate(c.getActualReturnDate());
        vo.setNote(c.getNote());
        vo.setCreatedByUserId(c.getCreatedByUserId());
        vo.setCreatedByName(c.getCreatedByName());
        vo.setCreatedAt(c.getCreatedAt());
        vo.setUpdatedAt(c.getUpdatedAt());
        return vo;
    }
}