package com.ssafy.lab.orak.recording.util;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Component;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.UnsupportedAudioFileException;
import java.io.File;
import java.io.IOException;

@Component
@Log4j2
public class AudioDurationCalculator {

    /**
     * 오디오 파일의 재생시간을 초 단위로 계산합니다.
     * 
     * @param filePath 오디오 파일 경로
     * @return 재생시간 (초), 계산할 수 없는 경우 0
     */
    public Integer calculateDurationInSeconds(String filePath) {
        try {
            File audioFile = new File(filePath);
            AudioFileFormat fileFormat = AudioSystem.getAudioFileFormat(audioFile);
            
            if (fileFormat.properties().containsKey("duration")) {
                Long durationInMicroseconds = (Long) fileFormat.properties().get("duration");
                return (int) (durationInMicroseconds / 1_000_000);
            }
            
            // 파일 크기와 비트레이트를 이용한 추정 계산
            int frameLength = fileFormat.getFrameLength();
            float frameRate = fileFormat.getFormat().getFrameRate();
            
            if (frameLength != AudioSystem.NOT_SPECIFIED && frameRate != AudioSystem.NOT_SPECIFIED) {
                float durationInSeconds = frameLength / frameRate;
                return Math.round(durationInSeconds);
            }
            
            log.warn("오디오 파일의 재생시간을 계산할 수 없습니다: {}", filePath);
            return 0;
            
        } catch (UnsupportedAudioFileException e) {
            log.error("지원하지 않는 오디오 파일 형식: {}", filePath, e);
            return 0;
        } catch (IOException e) {
            log.error("오디오 파일 읽기 실패: {}", filePath, e);
            return 0;
        } catch (Exception e) {
            log.error("오디오 파일 재생시간 계산 중 오류 발생: {}", filePath, e);
            return 0;
        }
    }
}