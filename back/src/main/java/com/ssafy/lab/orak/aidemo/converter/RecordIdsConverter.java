package com.ssafy.lab.orak.aidemo.converter;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import lombok.extern.log4j.Log4j2;

import java.util.ArrayList;
import java.util.List;

@Converter
@Log4j2
public class RecordIdsConverter implements AttributeConverter<List<Long>, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(List<Long> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            log.error("Record ID 리스트를 JSON으로 변환 실패: {}", attribute, e);
            throw new IllegalArgumentException("Record ID 리스트 변환 실패", e);
        }
    }

    @Override
    public List<Long> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(dbData, new TypeReference<List<Long>>() {});
        } catch (JsonProcessingException e) {
            log.error("JSON을 Record ID 리스트로 변환 실패: {}", dbData, e);
            throw new IllegalArgumentException("JSON 파싱 실패", e);
        }
    }
}