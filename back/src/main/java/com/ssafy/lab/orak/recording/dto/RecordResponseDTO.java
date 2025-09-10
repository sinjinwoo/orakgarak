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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Upload 참조만
    private Long uploadId;
    
}
