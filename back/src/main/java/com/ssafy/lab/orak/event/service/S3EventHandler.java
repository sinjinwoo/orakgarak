package com.ssafy.lab.orak.event.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.lab.orak.event.dto.S3EventNotification;
import com.ssafy.lab.orak.event.dto.UploadEvent;
import com.ssafy.lab.orak.event.exception.EventProcessingException;
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
            log.info("S3 이벤트 수신 - Event: {}, Bucket: {}, Key: {}, Size: {}", 
                    eventName, bucketName, objectKey, objectSize);

            if (eventName != null && eventName.startsWith("s3:ObjectCreated:")) {
                handleObjectCreatedDirect(objectKey, bucketName, objectSize);
            } else if (eventName != null && eventName.startsWith("s3:ObjectRemoved:")) {
                handleObjectRemoved(objectKey);
            } else {
                log.debug("S3 이벤트 무시: {}", eventName);
            }
            
        } catch (EventProcessingException e) {
            log.error("S3 이벤트 처리 실패: bucket={}, key={}", bucketName, objectKey, e);
            throw e;
        } catch (Exception e) {
            log.error("S3 이벤트 처리 중 예상치 못한 오류: bucket={}, key={}", bucketName, objectKey, e);
            throw new EventProcessingException("S3 이벤트 처리 실패: " + e.getMessage(), e);
        }
    }

    private void handleObjectCreatedDirect(String objectKey, String bucketName, Long objectSize) {
        log.info("S3 객체 생성 이벤트 처리: {}", objectKey);
        
        try {
            // S3 키에서 UUID 추출 (예: uploads/{uuid}/filename.ext)
            String uuid = extractUuidFromS3Key(objectKey);
            
            if (uuid != null) {
                // UUID로 업로드 레코드 찾기
                Upload upload = fileUploadService.findByUuid(uuid);
                
                if (upload != null) {
                    // S3 업로드 완료로 상태 업데이트
                    if (upload.getProcessingStatus() == ProcessingStatus.UPLOADED) {
                        log.info("업로드 {} 이미 업로드 완료 상태", upload.getId());
                    } else {
                        fileUploadService.updateProcessingStatus(upload.getId(), ProcessingStatus.UPLOADED);
                        log.info("S3 이벤트 후 업로드 {} 상태를 UPLOADED로 변경", upload.getId());
                    }
                    
                    // 파일 크기 업데이트 (실제 S3 크기와 동기화)
                    if (objectSize != null && !objectSize.equals(upload.getFileSize())) {
                        upload.setFileSize(objectSize);
                        fileUploadService.getUploadRepository().save(upload);
                        log.info("업로드 {} 파일 크기 업데이트: {}", upload.getId(), objectSize);
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
                    log.info("업로드 완료 이벤트 발송: uploadId={}", upload.getId());
                } else {
                    log.warn("UUID에 해당하는 업로드 레코드 없음: {}", uuid);
                }
            } else {
                log.warn("S3 키에서 UUID 추출 실패: {}", objectKey);
            }
            
        } catch (Exception e) {
            log.error("S3 객체 생성 이벤트 처리 실패: {}", objectKey, e);
            throw new EventProcessingException("S3 객체 생성 이벤트 처리 실패: " + objectKey, e);
        }
    }

    private void handleObjectRemoved(String objectKey) {
        log.info("S3 객체 삭제 이벤트 처리: {}", objectKey);
        
        try {
            String uuid = extractUuidFromS3Key(objectKey);
            
            if (uuid != null) {
                Upload upload = fileUploadService.findByUuid(uuid);
                
                if (upload != null) {
                    // 파일이 S3에서 삭제된 경우 처리 실패로 마킹
                    fileUploadService.markProcessingFailed(upload.getId(), 
                            "S3 저장소에서 파일이 삭제됨");
                    log.info("S3 파일 삭제로 인해 업로드 {} 실패 처리", upload.getId());
                } else {
                    log.warn("삭제된 S3 객체 UUID에 해당하는 업로드 레코드 없음: {}", uuid);
                }
            }
            
        } catch (Exception e) {
            log.error("S3 객체 삭제 이벤트 처리 실패: {}", objectKey, e);
            throw new EventProcessingException("S3 객체 삭제 이벤트 처리 실패: " + objectKey, e);
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