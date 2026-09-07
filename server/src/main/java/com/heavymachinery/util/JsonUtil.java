package com.heavymachinery.util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * JSON 序列化工具
 */
public class JsonUtil {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonUtil() {
    }

    public static String toJson(Object o) {
        if (o == null) return null;
        try {
            return MAPPER.writeValueAsString(o);
        } catch (Exception e) {
            throw new RuntimeException("JSON 序列化失败", e);
        }
    }

    public static List<Map<String, Object>> toListMap(String json) {
        if (json == null || json.isEmpty()) return new ArrayList<>();
        try {
            return MAPPER.readValue(json, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("JSON 解析失败", e);
        }
    }

    public static Map<String, Object> toMap(String json) {
        if (json == null || json.isEmpty()) return new HashMap<>();
        try {
            return MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("JSON 解析失败", e);
        }
    }

    public static Map<String, Object> deepCopyMap(Map<String, Object> src) {
        return toMap(toJson(src));
    }

    public static List<Long> toLongList(String json) {
        if (json == null || json.isEmpty()) return new ArrayList<>();
        try {
            return MAPPER.readValue(json, new TypeReference<List<Long>>() {
            });
        } catch (Exception e) {
            throw new RuntimeException("JSON 解析失败", e);
        }
    }
}