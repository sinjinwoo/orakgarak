package com.ssafy.lab.orak.aidemo.mapper;

import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationRequestDTO;
import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationResponseDTO;
import com.ssafy.lab.orak.aidemo.entity.AiDemoApplication;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AiDemoApplicationMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "recordId", source = "requestDTO.recordId")
    @Mapping(target = "youtubeLinks", source = "requestDTO.youtubeLinks")
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "adminNote", ignore = true)
    @Mapping(target = "processedAt", ignore = true)
    @Mapping(target = "record", ignore = true)
    AiDemoApplication toEntity(AiDemoApplicationRequestDTO requestDTO, Long userId);

    @Mapping(target = "statusDescription", source = "status.description")
    @Mapping(target = "record", ignore = true)
    AiDemoApplicationResponseDTO toResponseDTO(AiDemoApplication application);

    @Mapping(target = "id", source = "application.id")
    @Mapping(target = "userId", source = "application.userId")
    @Mapping(target = "recordId", source = "application.recordId")
    @Mapping(target = "youtubeLinks", source = "application.youtubeLinks")
    @Mapping(target = "status", source = "application.status")
    @Mapping(target = "statusDescription", source = "application.status.description")
    @Mapping(target = "adminNote", source = "application.adminNote")
    @Mapping(target = "createdAt", source = "application.createdAt")
    @Mapping(target = "updatedAt", source = "application.updatedAt")
    @Mapping(target = "processedAt", source = "application.processedAt")
    @Mapping(target = "record", source = "recordResponseDTO")
    AiDemoApplicationResponseDTO toResponseDTO(AiDemoApplication application, RecordResponseDTO recordResponseDTO);
}