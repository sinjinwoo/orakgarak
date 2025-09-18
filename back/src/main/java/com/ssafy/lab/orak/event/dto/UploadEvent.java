package com.ssafy.lab.orak.event.dto;

import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class UploadEvent {
    
    private String eventId;
    private String eventType; // UPLOAD_COMPLETED, STATUS_CHANGED, PROCESSING_REQUESTED
    private String source; // eventbridge, s3, manual
    
    // 업로드 정보
    private Long uploadId;
    private String uuid;
    private String originalFilename;
    private String s3Key;
    private String s3Bucket;
    private Long fileSize;
    private String contentType;
    private String directory;
    private Long uploaderId;
    
    // 처리 상태 정보
    private ProcessingStatus currentStatus;
    private ProcessingStatus previousStatus;
    private String statusMessage;
    private String errorMessage;
    private String errorCode;
    
    // 메타데이터
    private LocalDateTime eventTime;
    private LocalDateTime uploadTime;
    private String region;
    
    // 처리 설정
    private Boolean requiresAudioProcessing;
    private Boolean requiresImageProcessing;
    private Integer priority; // 1-10 (낮을수록 높은 우선순위)

    // 처리 결과
    private String processedS3Key;
    private Long processingDuration;
    
    public static UploadEvent createS3UploadEvent(Long uploadId, String uuid, String s3Key, 
                                                  String s3Bucket, Long fileSize, String contentType) {
        return UploadEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("UPLOAD_COMPLETED")
                .source("s3")
                .uploadId(uploadId)
                .uuid(uuid)
                .s3Key(s3Key)
                .s3Bucket(s3Bucket)
                .fileSize(fileSize)
                .contentType(contentType)
                .currentStatus(ProcessingStatus.UPLOADED)
                .previousStatus(ProcessingStatus.PENDING)
                .eventTime(LocalDateTime.now())
                .requiresAudioProcessing(contentType != null && contentType.startsWith("audio/"))
                .requiresImageProcessing(contentType != null && contentType.startsWith("image/"))
                .priority(contentType != null && contentType.startsWith("audio/") ? 1 : 5)
                .build();
    }
    
    public static UploadEvent createProcessingRequestEvent(Long uploadId, String uuid, 
                                                          ProcessingStatus targetStatus, Integer priority) {
        return UploadEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("PROCESSING_REQUESTED")
                .source("batch")
                .uploadId(uploadId)
                .uuid(uuid)
                .currentStatus(targetStatus)
                .eventTime(LocalDateTime.now())
                .priority(priority != null ? priority : 5)
                .build();
    }
    
    public static UploadEvent createStatusChangeEvent(Long uploadId, String uuid, 
                                                     ProcessingStatus currentStatus, ProcessingStatus previousStatus,
                                                     String message) {
        return UploadEvent.builder()
                .eventId(java.util.UUID.randomUUID().toString())
                .eventType("STATUS_CHANGED")
                .source("processing")
                .uploadId(uploadId)
                .uuid(uuid)
                .currentStatus(currentStatus)
                .previousStatus(previousStatus)
                .statusMessage(message)
                .eventTime(LocalDateTime.now())
                .build();
    }
}