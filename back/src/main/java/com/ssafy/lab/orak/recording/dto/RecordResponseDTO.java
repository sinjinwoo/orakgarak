package com.ssafy.lab.orak.recording.dto;

import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.upload.entity.Upload;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class RecordResponseDTO {
    
    private Long id;
    private Long userId;
    private Long songId;
    private String title;
    private Integer durationSeconds;

    private String extension;
    private String content_type;
    private String file_size;
    private String url;
    private String urlStatus; // "SUCCESS", "FAILED" 등의 상태

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Upload 참조만
    private Long uploadId;
    
}
