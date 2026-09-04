package com.heavymachinery.dto;

import com.heavymachinery.entity.Machinery;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 设备列表/详情返回 DTO，将技术参数组合成 specs 对象
 */
@Data
public class MachineryVO {

    private Long id;
    private String name;
    private String model;
    private String category;
    private String brand;
    private String description;
    private BigDecimal price;
    private Integer stock;
    private String status;
    private String image;
    private Boolean recommended;
    private LocalDateTime createdAt;
    private Map<String, String> specs = new HashMap<>();

    public static MachineryVO from(Machinery m) {
        MachineryVO vo = new MachineryVO();
        vo.setId(m.getId());
        vo.setName(m.getName());
        vo.setModel(m.getModel());
        vo.setCategory(m.getCategory());
        vo.setBrand(m.getBrand());
        vo.setDescription(m.getDescription());
        vo.setPrice(m.getPrice());
        vo.setStock(m.getStock());
        vo.setStatus(m.getStatus());
        vo.setImage(m.getImage());
        vo.setRecommended(m.getRecommended());
        vo.setCreatedAt(m.getCreatedAt());
        if (m.getSpecWeight() != null) vo.getSpecs().put("weight", m.getSpecWeight());
        if (m.getSpecPower() != null) vo.getSpecs().put("power", m.getSpecPower());
        if (m.getSpecDimensions() != null) vo.getSpecs().put("dimensions", m.getSpecDimensions());
        if (m.getSpecCapacity() != null) vo.getSpecs().put("capacity", m.getSpecCapacity());
        return vo;
    }
}
