package com.ssafy.lab.orak.upload.entity;

import com.ssafy.lab.orak.common.entity.BaseEntity;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "uploads")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Upload extends BaseEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String originalFilename;
    
    @Column(nullable = false)
    private String uuid;
    
    @Column(nullable = false)
    @Setter
    private String extension;

    @Column(nullable = false)
    private Long uploaderId;

    @Column(name = "file_size", nullable = false)
    @Setter
    private Long fileSize;

    @Column(nullable = false)
    @Setter
    private String contentType;
    
    @Column(nullable = false)
    private String directory;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status")
    @Builder.Default
    @Setter
    private ProcessingStatus processingStatus = ProcessingStatus.UPLOADED;
    
    @Column(name = "processing_error_message")
    @Setter
    private String processingErrorMessage;

    @Column(name = "retry_count")
    @Builder.Default
    @Setter
    private Integer retryCount = 0;

    @Column(name = "last_failed_at")
    @Setter
    private LocalDateTime lastFailedAt;
    
    // 편의 메서드: 저장된 파일명 생성
    public String getStoredFilename() {
        if (extension == null || extension.isEmpty()) {
            return uuid + "_" + originalFilename;
        }
        return uuid + "_" + originalFilename + "." + extension;
    }

    // 편의 메서드: 전체 파일 경로 생성
    public String getFullPath() {
        return directory + "/" + getStoredFilename();
    }
    
    // 편의 메서드: 오디오 파일인지 확인
    public boolean isAudioFile() {
        return contentType != null && 
               (contentType.startsWith("audio/") || 
                isAudioExtension(extension));
    }
    
    // 편의 메서드: 이미지 파일인지 확인
    public boolean isImageFile() {
        return contentType != null && contentType.startsWith("image/");
    }
    
    // 편의 메서드: 처리 상태 업데이트
    public void updateProcessingStatus(ProcessingStatus status) {
        this.processingStatus = status;
        this.processingErrorMessage = null; // 성공 시 에러 메시지 클리어
    }
    
    // 편의 메서드: 처리 실패 시 상태 업데이트
    public void markProcessingFailed(String errorMessage) {
        this.processingStatus = ProcessingStatus.FAILED;
        this.processingErrorMessage = errorMessage;
    }

    // 편의 메서드: 재시도 가능한 실패로 마킹
    public void markRetryableFailure(String errorMessage) {
        this.retryCount = (this.retryCount == null) ? 1 : this.retryCount + 1;
        this.lastFailedAt = java.time.LocalDateTime.now();
        this.processingErrorMessage = errorMessage;
        this.processingStatus = ProcessingStatus.PENDING; // 재시도를 위해 PENDING으로 설정
    }

    // 편의 메서드: 최대 재시도 횟수 초과 확인
    public boolean isMaxRetryExceeded(int maxRetries) {
        return this.retryCount != null && this.retryCount >= maxRetries;
    }

    // 편의 메서드: 재시도 가능 시간 확인 (지연 시간 고려)
    public boolean canRetryAfterDelay(long retryDelayMs) {
        if (this.lastFailedAt == null) return true;
        return java.time.LocalDateTime.now()
                .isAfter(this.lastFailedAt.plusNanos(retryDelayMs * 1_000_000));
    }

    // 편의 메서드: 재시도 카운터 리셋 (성공 시)
    public void resetRetryCount() {
        this.retryCount = 0;
        this.lastFailedAt = null;
    }

    // 편의 메서드: 에러 메시지 getter (테스트 호환성)
    public String getErrorMessage() {
        return this.processingErrorMessage;
    }
    
    private boolean isAudioExtension(String ext) {
        if (ext == null) return false;
        String lowerExt = ext.toLowerCase();
        return lowerExt.equals("mp3") || lowerExt.equals("wav") ||
               lowerExt.equals("m4a") || lowerExt.equals("flac") ||
               lowerExt.equals("aac") || lowerExt.equals("ogg");
    }

}