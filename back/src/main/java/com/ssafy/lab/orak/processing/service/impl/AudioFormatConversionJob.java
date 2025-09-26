package com.ssafy.lab.orak.processing.service.impl;

import com.ssafy.lab.orak.event.service.KafkaEventProducer;
import com.ssafy.lab.orak.processing.exception.AudioProcessingException;
import com.ssafy.lab.orak.processing.service.ProcessingJob;
import com.ssafy.lab.orak.recording.repository.RecordRepository;
import com.ssafy.lab.orak.recording.util.AudioConverter;
import com.ssafy.lab.orak.s3.helper.S3Helper;
import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.repository.UploadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@RequiredArgsConstructor
@Log4j2
public class AudioFormatConversionJob implements ProcessingJob {

    private final AudioConverter audioConverter;
    private final S3Helper s3Helper;
    private final UploadRepository uploadRepository;
    private final RecordRepository recordRepository;
    private final KafkaEventProducer kafkaEventProducer;

    @Value("${orak.upload.path:/tmp/orak-upload}")
    private String uploadPath;
    
    @Override
    public boolean process(Upload upload) {
        log.info("포맷 변환 시작: upload: {} ({})", upload.getId(), upload.getOriginalFilename());
        
        try {
            // 1. 실제 포맷 변환 수행
            performActualConversion(upload);
            log.info("오디오 변환 완료 - uploadId: {}", upload.getId());

            // 2. WAV 변환 완료 상태로 업데이트
            upload.setProcessingStatus(ProcessingStatus.AUDIO_CONVERTED);
            uploadRepository.save(upload);
            log.info("오디오 변환 완료 상태 업데이트 - uploadId: {}", upload.getId());

            // 3. 음성 분석을 위한 Kafka 이벤트 발송
            triggerVoiceAnalysis(upload);

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
               (upload.getProcessingStatus() == ProcessingStatus.UPLOADED ||
                upload.getProcessingStatus() == ProcessingStatus.PROCESSING);
    }

    @Override
    public ProcessingStatus getProcessingStatus() {
        return ProcessingStatus.AUDIO_CONVERTING;
    }

    @Override
    public ProcessingStatus getCompletedStatus() {
        return ProcessingStatus.AUDIO_CONVERTED;
    }
    
    @Override
    public int getPriority() {
        return 10; // WAV 변환은 높은 우선순위 (사용자 재생을 위해)
    }
    
    @Override
    public long getEstimatedProcessingTimeMs(Upload upload) {
        // 파일 크기에 따른 예상 변환 시간 (1MB당 약 5초)
        long fileSizeMB = upload.getFileSize() / (1024 * 1024);
        return Math.max(5000, fileSizeMB * 5000); // 최소 5초
    }

    /**
     * 실제 포맷 변환 수행
     */
    private void performActualConversion(Upload upload) throws Exception {
        String currentFormat = upload.getExtension().toLowerCase();

        // WAV 파일이면 변환하지 않음
        if ("wav".equals(currentFormat)) {
            log.info("파일이 이미 WAV 형식입니다. 변환을 건너뜁니다: {}", upload.getOriginalFilename());
            return;
        }

        log.info("실제 오디오 변환 시작: {} ({}) -> WAV", upload.getOriginalFilename(), currentFormat.toUpperCase());

        // 1. S3에서 원본 파일 다운로드
        String localFilePath = downloadFromS3(upload);
        String convertedFilePath = null;

        try {
            // 2. AudioConverter를 사용하여 실제 FFmpeg 변환 수행
            String outputDirectory = uploadPath + "/converted";
            convertedFilePath = audioConverter.convertToWav(
                localFilePath,
                outputDirectory,
                upload.getUuid(),
                upload.getOriginalFilename()
            );

            // 3. 변환된 파일을 S3에 업로드
            uploadConvertedFileToS3(upload, convertedFilePath);

            // 4. Upload 엔티티 업데이트
            updateUploadEntity(upload);

            log.info("실제 오디오 변환 완료: {} -> WAV", upload.getOriginalFilename());

        } finally {
            // 5. 로컬 임시 파일들 정리
            cleanupLocalFiles(localFilePath, convertedFilePath);
        }
    }

    private String downloadFromS3(Upload upload) throws Exception {
        // 로컬 다운로드 디렉토리 생성
        Path downloadDir = Paths.get(uploadPath, "downloads");
        Files.createDirectories(downloadDir);

        String localFileName = upload.getUuid() + "_" + upload.getOriginalFilename();
        Path localFilePath = downloadDir.resolve(localFileName);

        String s3Key = upload.getFullPath();
        log.info("S3에서 파일 다운로드 시작: {} -> {}", s3Key, localFilePath);

        // S3Helper를 사용하여 실제 파일 다운로드
        return s3Helper.downloadFile(s3Key, localFilePath.toString());
    }

    private void uploadConvertedFileToS3(Upload upload, String convertedFilePath) throws Exception {
        File convertedFile = new File(convertedFilePath);

        // AudioConverter가 성공적으로 완료되었다면 파일이 존재해야 함
        // 테스트 환경에서는 Mock으로 처리됨
        if (!convertedFile.exists()) {
            throw new AudioProcessingException("변환된 파일을 찾을 수 없습니다: " + convertedFilePath);
        }

        // 기존 S3 키와 새로운 S3 키 생성 (확장자를 wav로 변경)
        String originalS3Key = upload.getFullPath();
        String newS3Key = originalS3Key.replaceAll("\\.[^.]+$", ".wav");

        log.info("변환된 파일 S3 업로드: {} -> {}", convertedFilePath, newS3Key);

        // 원본 파일 백업을 위한 임시 키 생성
        String backupS3Key = originalS3Key + ".backup";
        boolean backupCreated = false;
        boolean newFileUploaded = false;

        try {
            // 1. 원본 파일을 백업으로 복사 (롤백용)
            s3Helper.copyFile(originalS3Key, backupS3Key);
            backupCreated = true;
            log.debug("원본 파일 백업 생성: {} -> {}", originalS3Key, backupS3Key);

            // 2. S3에 변환된 파일 업로드
            s3Helper.uploadFile(convertedFile, newS3Key, "audio/wav");
            newFileUploaded = true;
            log.info("변환된 파일 S3 업로드 완료: {}", newS3Key);

            // 3. 원본 파일 삭제
            s3Helper.deleteFile(originalS3Key);
            log.info("원본 파일 삭제 완료: {}", originalS3Key);

            // 4. 백업 파일 삭제 (성공 시)
            s3Helper.deleteFile(backupS3Key);
            log.debug("백업 파일 삭제 완료: {}", backupS3Key);

            log.info("S3 파일 교체 완료: {} -> {}", originalS3Key, newS3Key);

        } catch (Exception e) {
            log.error("S3 파일 업로드/교체 실패, 롤백 시작: {}", e.getMessage());

            // 롤백 처리
            try {
                // 업로드된 새 파일이 있으면 삭제
                if (newFileUploaded) {
                    s3Helper.deleteFile(newS3Key);
                    log.info("롤백: 업로드된 변환 파일 삭제 완료: {}", newS3Key);
                }

                // 백업 파일이 있으면 원본으로 복원
                if (backupCreated) {
                    // 원본 파일이 삭제되었다면 백업에서 복원
                    if (!s3Helper.fileExists(originalS3Key)) {
                        s3Helper.copyFile(backupS3Key, originalS3Key);
                        log.info("롤백: 백업에서 원본 파일 복원 완료: {} -> {}", backupS3Key, originalS3Key);
                    }
                    // 백업 파일 삭제
                    s3Helper.deleteFile(backupS3Key);
                    log.info("롤백: 백업 파일 삭제 완료: {}", backupS3Key);
                }

                log.info("S3 파일 롤백 완료");
            } catch (Exception rollbackException) {
                log.error("S3 롤백 실패: {}", rollbackException.getMessage(), rollbackException);
                // 롤백 실패는 원본 예외에 추가 정보로 포함
                throw new AudioProcessingException(
                        "S3 업로드 실패 및 롤백 실패: " + e.getMessage() +
                        " (롤백 오류: " + rollbackException.getMessage() + ")", e);
            }

            // 원본 예외 재발생
            throw new AudioProcessingException("S3 파일 업로드 실패: " + e.getMessage(), e);
        }
    }

    private void updateUploadEntity(Upload upload) {
        upload.setExtension("wav");
        upload.setContentType("audio/wav");
        uploadRepository.save(upload);
        log.info("Upload 엔티티 업데이트 완료: uploadId={}, newExtension=wav", upload.getId());
    }

    /**
     * 음성 분석을 위한 Kafka 이벤트 발송
     */
    private void triggerVoiceAnalysis(Upload upload) {
        try {
            // Record 존재 여부 확인
            if (!recordRepository.existsByUploadId(upload.getId())) {
                log.info("Record가 존재하지 않아 음성 분석을 건너뜀 - uploadId: {}", upload.getId());
                return;
            }

            // Kafka 이벤트 발송
            kafkaEventProducer.sendVoiceAnalysisEvent(upload.getId());

            log.info("음성 분석 이벤트 발송 완료 - uploadId: {}", upload.getId());

        } catch (Exception e) {
            log.error("음성 분석 이벤트 발송 실패 - uploadId: {}", upload.getId(), e);
            // 음성 분석 이벤트 발송 실패해도 WAV 변환 자체는 성공으로 처리
        }
    }

    private void cleanupLocalFiles(String... filePaths) {
        for (String filePath : filePaths) {
            if (filePath == null) continue;

            try {
                File file = new File(filePath);
                if (file.exists()) {
                    boolean deleted = file.delete();
                    if (deleted) {
                        log.debug("로컬 파일 삭제 성공: {}", filePath);
                    } else {
                        log.warn("로컬 파일 삭제 실패: {}", filePath);
                    }
                }
            } catch (Exception e) {
                log.warn("로컬 파일 삭제 중 오류 발생: {}", filePath, e);
            }
        }
    }
}