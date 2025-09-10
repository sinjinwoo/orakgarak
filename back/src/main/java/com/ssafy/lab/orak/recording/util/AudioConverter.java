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
            throw new AudioConversionException("오디오 파일 WAV 변환 실패: " + originalFilePath, e);
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