package com.ssafy.lab.orak.aidemo.mapper;

import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationRequestDTO;
import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationResponseDTO;
import com.ssafy.lab.orak.aidemo.entity.AiDemoApplication;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import java.util.List;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface AiDemoApplicationMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "recordIds", source = "requestDTO.recordIds")
    @Mapping(target = "youtubeLinks", source = "requestDTO.youtubeLinks")
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "adminNote", ignore = true)
    @Mapping(target = "processedAt", ignore = true)
    AiDemoApplication toEntity(AiDemoApplicationRequestDTO requestDTO, Long userId);

    @Mapping(target = "statusDescription", source = "status.description")
    @Mapping(target = "records", ignore = true)
    AiDemoApplicationResponseDTO toResponseDTO(AiDemoApplication application);

    @Mapping(target = "id", source = "application.id")
    @Mapping(target = "userId", source = "application.userId")
    @Mapping(target = "recordIds", source = "application.recordIds")
    @Mapping(target = "youtubeLinks", source = "application.youtubeLinks")
    @Mapping(target = "status", source = "application.status")
    @Mapping(target = "statusDescription", source = "application.status.description")
    @Mapping(target = "adminNote", source = "application.adminNote")
    @Mapping(target = "createdAt", source = "application.createdAt")
    @Mapping(target = "updatedAt", source = "application.updatedAt")
    @Mapping(target = "processedAt", source = "application.processedAt")
    @Mapping(target = "records", source = "recordResponseDTOs")
    AiDemoApplicationResponseDTO toResponseDTO(AiDemoApplication application,   List<RecordResponseDTO> recordResponseDTOs);
}