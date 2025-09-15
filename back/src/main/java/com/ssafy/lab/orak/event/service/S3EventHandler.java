package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.S3EventNotification;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class S3EventHandler {

    private final FileUploadService fileUploadService;
    private final ObjectMapper objectMapper;
    private final EventBridgeService eventBridgeService;

    // EventBridge에서 직접 호출하는 메서드 (SQS 제거)
    public void handleS3Event(String objectKey, String bucketName, Long objectSize, String eventName) {
        try {
            log.info("Received S3 event - Event: {}, Bucket: {}, Key: {}, Size: {}", 
                    eventName, bucketName, objectKey, objectSize);

            if (eventName != null && eventName.startsWith("s3:ObjectCreated:")) {
                handleObjectCreatedDirect(objectKey, bucketName, objectSize);
            } else if (eventName != null && eventName.startsWith("s3:ObjectRemoved:")) {
                handleObjectRemoved(objectKey);
            } else {
                log.debug("Ignoring S3 event: {}", eventName);
            }
            
        } catch (Exception e) {
            log.error("Failed to process S3 event: bucket={}, key={}", bucketName, objectKey, e);
        }
    }

    private void handleObjectCreatedDirect(String objectKey, String bucketName, Long objectSize) {
        log.info("Handling S3 object created event for key: {}", objectKey);
        
        try {
            // S3 키에서 UUID 추출 (예: uploads/{uuid}/filename.ext)
            String uuid = extractUuidFromS3Key(objectKey);
            
            if (uuid != null) {
                // UUID로 업로드 레코드 찾기
                Upload upload = fileUploadService.findByUuid(uuid);
                
                if (upload != null) {
                    // S3 업로드 완료로 상태 업데이트
                    if (upload.getProcessingStatus() == ProcessingStatus.UPLOADED) {
                        log.info("Upload {} already marked as uploaded", upload.getId());
                    } else {
                        fileUploadService.updateProcessingStatus(upload.getId(), ProcessingStatus.UPLOADED);
                        log.info("Updated upload {} status to UPLOADED after S3 event", upload.getId());
                    }
                    
                    // 파일 크기 업데이트 (실제 S3 크기와 동기화)
                    if (objectSize != null && !objectSize.equals(upload.getFileSize())) {
                        upload.setFileSize(objectSize);
                        fileUploadService.getUploadRepository().save(upload);
                        log.info("Updated file size for upload {} to {}", upload.getId(), objectSize);
                    }
                    
                    // EventBridge + Kafka로 업로드 완료 이벤트 발송
                    UploadEvent uploadEvent = UploadEvent.createS3UploadEvent(
                            upload.getId(), 
                            upload.getUuid(), 
                            objectKey, 
                            bucketName, 
                            objectSize, 
                            upload.getContentType()
                    );
                    
                    eventBridgeService.publishUploadEvent(uploadEvent);
                    log.info("Published upload completion event for uploadId: {}", upload.getId());
                } else {
                    log.warn("No upload record found for UUID: {}", uuid);
                }
            } else {
                log.warn("Could not extract UUID from S3 key: {}", objectKey);
            }
            
        } catch (Exception e) {
            log.error("Failed to handle S3 object created event for key: {}", objectKey, e);
        }
    }

    private void handleObjectRemoved(String objectKey) {
        log.info("Handling S3 object removed event for key: {}", objectKey);
        
        try {
            String uuid = extractUuidFromS3Key(objectKey);
            
            if (uuid != null) {
                Upload upload = fileUploadService.findByUuid(uuid);
                
                if (upload != null) {
                    // 파일이 S3에서 삭제된 경우 처리 실패로 마킹
                    fileUploadService.markProcessingFailed(upload.getId(), 
                            "File was removed from S3 storage");
                    log.info("Marked upload {} as failed due to S3 file removal", upload.getId());
                } else {
                    log.warn("No upload record found for removed S3 object UUID: {}", uuid);
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to handle S3 object removed event for key: {}", objectKey, e);
        }
    }

    private String extractUuidFromS3Key(String s3Key) {
        // S3 키 형태: uploads/{uuid}/filename.ext
        // 또는 다른 패턴에 따라 UUID 추출
        if (s3Key == null || !s3Key.contains("/")) {
            return null;
        }
        
        String[] parts = s3Key.split("/");
        if (parts.length >= 2 && "uploads".equals(parts[0])) {
            return parts[1]; // UUID 부분 반환
        }
        
        return null;
    }
}