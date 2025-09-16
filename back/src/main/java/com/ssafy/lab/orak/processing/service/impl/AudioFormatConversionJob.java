package com.ssafy.lab.orak.processing.service.impl;

import com.ssafy.lab.orak.processing.exception.AudioProcessingException;
import com.ssafy.lab.orak.processing.service.ProcessingJob;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;

@Component
@RequiredArgsConstructor
@Slf4j
public class AudioFormatConversionJob implements ProcessingJob {
    
    @Override
    public boolean process(Upload upload) {
        log.info("포맷 변환 시작: upload: {} ({})", upload.getId(), upload.getOriginalFilename());
        
        try {
            // 포맷 변환 시뮬레이션
            simulateFormatConversion(upload);
            
            log.info("포맷 변환 완료: upload: {}", upload.getId());
            return true;
            
        } catch (AudioProcessingException e) {
            log.error("포맷 변환 실패: upload: {}", upload.getId(), e);
            return false;
        } catch (Exception e) {
            log.error("포맷 변환 중 예상치 못한 오류 발생: upload: {}", upload.getId(), e);
            throw new AudioProcessingException("포맷 변환 중 예상치 못한 오류가 발생했습니다", e);
        }
    }
    
    @Override
    public boolean canProcess(Upload upload) {
        return upload.isAudioFile() && 
               upload.getProcessingStatus() == ProcessingStatus.PROCESSING;
    }
    
    @Override
    public ProcessingStatus getProcessingStatus() {
        return ProcessingStatus.CONVERTING;
    }
    
    @Override
    public ProcessingStatus getCompletedStatus() {
        return ProcessingStatus.COMPLETED;
    }
    
    @Override
    public int getPriority() {
        return 3; // 중간 우선순위
    }
    
    @Override
    public long getEstimatedProcessingTimeMs(Upload upload) {
        // 파일 크기에 따른 예상 변환 시간 (1MB당 약 5초)
        long fileSizeMB = upload.getFileSize() / (1024 * 1024);
        return Math.max(5000, fileSizeMB * 5000); // 최소 5초
    }
    
    private void simulateFormatConversion(Upload upload) throws InterruptedException {
        // 실제 포맷 변환 시뮬레이션
        long processingTime = getEstimatedProcessingTimeMs(upload);
        
        // 실제로는 FFmpeg 또는 다른 오디오 처리 라이브러리 사용
        long actualTime = ThreadLocalRandom.current().nextLong(
            processingTime / 3, 
            processingTime
        );
        
        log.info("포맷 변환 시뮬레이션 실행: {}ms", actualTime);
        Thread.sleep(Math.min(actualTime, 3000)); // 최대 3초로 제한 (테스트용)
        
        // 95% 성공률로 시뮬레이션
        if (ThreadLocalRandom.current().nextDouble() < 0.05) {
            throw new com.ssafy.lab.orak.processing.exception.AudioProcessingException("포맷 변환 시뮬레이션 실패");
        }
        
        // 변환 결과 시뮬레이션
        String convertedFormat = determineTargetFormat(upload);
        log.info("포맷 변환 결과: {}: {} -> {}", 
                upload.getOriginalFilename(), upload.getExtension(), convertedFormat);
    }
    
    private String determineTargetFormat(Upload upload) {
        // 실제로는 비즈니스 로직에 따라 결정
        String currentFormat = upload.getExtension().toLowerCase();
        
        return switch (currentFormat) {
            case "wav", "flac" -> "mp3"; // 무손실 -> 압축
            case "m4a", "aac" -> "mp3"; // 다른 압축 -> 표준 압축
            default -> "mp3"; // 기본적으로 mp3로 변환
        };
    }
}