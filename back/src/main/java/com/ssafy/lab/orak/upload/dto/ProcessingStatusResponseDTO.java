package com.ssafy.lab.orak.upload.dto;

import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingStatusResponseDTO {
    
    private Long uploadId;
    private String originalFilename;
    private String extension;
    private ProcessingStatus status;
    private String statusDescription;
    private String errorMessage;
    private Double progressPercentage; // 진행률 (0-100)
    private String estimatedTimeRemaining; // 예상 남은 시간
    private LocalDateTime uploadedAt;
    private LocalDateTime lastUpdatedAt;
    
    // 파일 타입 정보
    private String contentType;
    private Long fileSize;
    private Boolean isAudioFile;
    private Boolean isImageFile;
    
    public static ProcessingStatusResponseDTO from(Upload upload) {
        return ProcessingStatusResponseDTO.builder()
                .uploadId(upload.getId())
                .originalFilename(upload.getOriginalFilename())
                .extension(upload.getExtension())
                .status(upload.getProcessingStatus())
                .statusDescription(upload.getProcessingStatus().getDescription())
                .errorMessage(upload.getProcessingErrorMessage())
                .progressPercentage(calculateProgress(upload.getProcessingStatus()))
                .estimatedTimeRemaining(estimateTimeRemaining(upload.getProcessingStatus()))
                .uploadedAt(upload.getCreatedAt())
                .lastUpdatedAt(upload.getUpdatedAt())
                .contentType(upload.getContentType())
                .fileSize(upload.getFileSize())
                .isAudioFile(upload.isAudioFile())
                .isImageFile(upload.isImageFile())
                .build();
    }
    
    private static Double calculateProgress(ProcessingStatus status) {
        return switch (status) {
            case PENDING -> 0.0;
            case UPLOADED -> 10.0;
            case PROCESSING -> 30.0;
            case CONVERTING -> 70.0;
            case ANALYZING -> 80.0;
            case ANALYSIS_PENDING -> 90.0;
            case IMAGE_OPTIMIZING -> 60.0;
            case THUMBNAIL_GENERATING -> 80.0;
            case COMPLETED -> 95.0;
            case VECTOR_COMPLETED -> 100.0;
            case FAILED -> 0.0;
        };
    }
    
    private static String estimateTimeRemaining(ProcessingStatus status) {
        return switch (status) {
            case PENDING -> "업로드 대기 중";
            case UPLOADED -> "처리 대기 중";
            case PROCESSING -> "약 3-5분";
            case CONVERTING -> "약 1-2분";
            case ANALYZING -> "약 2-3분";
            case ANALYSIS_PENDING -> "약 1분 이내";
            case IMAGE_OPTIMIZING -> "약 30초";
            case THUMBNAIL_GENERATING -> "약 10초";
            case COMPLETED -> "거의 완료";
            case VECTOR_COMPLETED -> "완료";
            case FAILED -> "처리 실패";
        };
    }
}