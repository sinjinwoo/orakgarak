package com.ssafy.lab.orak.recording.mapper;

import com.ssafy.lab.orak.recording.dto.RecordRequestDTO;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.upload.entity.Upload;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;
import org.springframework.web.multipart.MultipartFile;

@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface RecordMapper {
    
    @Mapping(target = "audioFile", ignore = true)
    @Mapping(target = "title", source = "title")
    @Mapping(target = "songId", source = "songId")
    RecordRequestDTO toRequestDTO(String title, Long songId, MultipartFile audioFile);
    
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", source = "userId")
    @Mapping(target = "songId", source = "requestDTO.songId")
    @Mapping(target = "title", source = "requestDTO.title")
    @Mapping(target = "uploadId", source = "upload.id")
    @Mapping(target = "durationSeconds", ignore = true)
    @Mapping(target = "upload", ignore = true)
    Record toEntity(RecordRequestDTO requestDTO, Long userId, Upload upload);
    
    @Mapping(target = "uploadId", source = "uploadId")
    RecordResponseDTO toResponseDTO(Record record);
    
    @Mapping(target = "id", source = "record.id")
    @Mapping(target = "uploadId", source = "upload.id")
    @Mapping(target = "createdAt", source = "record.createdAt")
    @Mapping(target = "updatedAt", source = "record.updatedAt")
    RecordResponseDTO toResponseDTO(Record record, Upload upload);
}