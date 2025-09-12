package com.ssafy.lab.orak.recording.util;

import com.github.kokorin.jaffree.ffmpeg.FFmpeg;
import com.github.kokorin.jaffree.ffmpeg.UrlInput;
import com.github.kokorin.jaffree.ffmpeg.UrlOutput;
import com.ssafy.lab.orak.recording.exception.AudioConversionException;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@Log4j2
public class AudioConverter {

    /**
     * 오디오 파일을 WAV 형식으로 변환
     */
    public String convertToWav(String originalFilePath, String outputDirectory) {
        try {
            Path originalPath = Paths.get(originalFilePath);
            String fileName = originalPath.getFileName().toString();
            String baseName = getBaseName(fileName);
            String wavFileName = baseName + ".wav";
            Path wavPath = Paths.get(outputDirectory, wavFileName);
            
            // 이미 WAV 파일인지 확인
            String extension = getExtension(fileName);
            if ("wav".equalsIgnoreCase(extension)) {
                log.info("파일이 이미 WAV 형식입니다. 변환을 건너뜁니다: {}", fileName);
                return originalFilePath; // 이미 WAV 파일이므로 원본 파일 경로 반환
            }
            
            // FFmpeg 사용 가능 여부 확인
            if (!isFFmpegAvailable()) {
                log.warn("FFmpeg을 사용할 수 없습니다. 원본 파일을 그대로 사용합니다: {}", fileName);
                return originalFilePath; // 변환하지 않고 원본 파일 경로 반환
            }
            
            FFmpeg.atPath()
                    .addInput(UrlInput.fromPath(originalPath))
                    .addOutput(UrlOutput.toPath(wavPath)
                            .setFormat("wav")
                            .addArguments("-ar", "16000") // 16kHz 샘플레이트
                            .addArguments("-ac", "1"))    // 모노 채널
                    .setOverwriteOutput(true)             // 기존 파일 덮어쓰기
                    .execute();
            
            log.info("오디오 파일 WAV 변환 완료: {} -> {}", fileName, wavFileName);
            return wavPath.toFile().getAbsolutePath();
            
        } catch (Exception e) {
            log.error("오디오 파일 WAV 변환 실패: {}", originalFilePath, e);
            // FFmpeg 변환 실패 시 원본 파일을 그대로 사용
            log.warn("FFmpeg 변환 실패로 인해 원본 파일을 사용합니다: {}", originalFilePath);
            return originalFilePath;
        }
    }
    
    /**
     * FFmpeg 사용 가능 여부 확인
     */
    private boolean isFFmpegAvailable() {
        try {
            // FFmpeg 버전 확인을 통해 사용 가능 여부 테스트
            FFmpeg.atPath().addArgument("-version").execute();
            return true;
        } catch (Exception e) {
            log.debug("FFmpeg을 사용할 수 없습니다: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 오디오 파일 여부 체크 (MIME Type과 확장자 기반)
     */
    public boolean isAudioFile(String fileName, String contentType) {
        // MIME Type 체크
        if (contentType != null && contentType.startsWith("audio/")) {
            return true;
        }
        
        // 확장자 기반 체크 (contentType이 null이거나 정확하지 않은 경우)
        String extension = getExtension(fileName).toLowerCase();
        return extension.matches("mp3|wav|flac|m4a|aac|ogg|mp4|webm|3gp|amr");
    }

    private String getBaseName(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
    }

    private String getExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        return lastDot > 0 ? fileName.substring(lastDot + 1).toLowerCase() : "";
    }
}