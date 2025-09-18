package com.ssafy.lab.orak.recording.mapper;

import com.ssafy.lab.orak.recording.dto.RecordRequestDTO;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.upload.entity.Upload;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    comments = "version: 1.6.3, compiler: Eclipse JDT (IDE) 3.43.0.v20250819-1513, environment: Java 21.0.8 (Eclipse Adoptium)"
)
@Component
public class RecordMapperImpl implements RecordMapper {

    @Override
    public RecordRequestDTO toRequestDTO(String title, Long songId, MultipartFile audioFile) {
        if ( title == null && songId == null && audioFile == null ) {
            return null;
        }

        RecordRequestDTO.RecordRequestDTOBuilder recordRequestDTO = RecordRequestDTO.builder();

        recordRequestDTO.title( title );
        recordRequestDTO.songId( songId );

        return recordRequestDTO.build();
    }

    @Override
    public Record toEntity(RecordRequestDTO requestDTO, Long userId, Upload upload) {
        if ( requestDTO == null && userId == null && upload == null ) {
            return null;
        }

        Record.RecordBuilder record = Record.builder();

        if ( requestDTO != null ) {
            record.songId( requestDTO.getSongId() );
            record.title( requestDTO.getTitle() );
        }
        if ( upload != null ) {
            record.uploadId( upload.getId() );
        }
        record.userId( userId );

        return record.build();
    }

    @Override
    public RecordResponseDTO toResponseDTO(Record record) {
        if ( record == null ) {
            return null;
        }

        RecordResponseDTO.RecordResponseDTOBuilder recordResponseDTO = RecordResponseDTO.builder();

        recordResponseDTO.uploadId( record.getUploadId() );
        recordResponseDTO.createdAt( record.getCreatedAt() );
        recordResponseDTO.durationSeconds( record.getDurationSeconds() );
        recordResponseDTO.id( record.getId() );
        recordResponseDTO.songId( record.getSongId() );
        recordResponseDTO.title( record.getTitle() );
        recordResponseDTO.updatedAt( record.getUpdatedAt() );
        recordResponseDTO.userId( record.getUserId() );

        return recordResponseDTO.build();
    }

    @Override
    public RecordResponseDTO toResponseDTO(Record record, Upload upload) {
        if ( record == null && upload == null ) {
            return null;
        }

        RecordResponseDTO.RecordResponseDTOBuilder recordResponseDTO = RecordResponseDTO.builder();

        if ( record != null ) {
            recordResponseDTO.id( record.getId() );
            recordResponseDTO.userId( record.getUserId() );
            recordResponseDTO.songId( record.getSongId() );
            recordResponseDTO.title( record.getTitle() );
            recordResponseDTO.durationSeconds( record.getDurationSeconds() );
            recordResponseDTO.createdAt( record.getCreatedAt() );
            recordResponseDTO.updatedAt( record.getUpdatedAt() );
        }
        if ( upload != null ) {
            recordResponseDTO.uploadId( upload.getId() );
            recordResponseDTO.extension( upload.getExtension() );
            recordResponseDTO.content_type( upload.getContentType() );
            if ( upload.getFileSize() != null ) {
                recordResponseDTO.file_size( String.valueOf( upload.getFileSize() ) );
            }
        }

        return recordResponseDTO.build();
    }
}
