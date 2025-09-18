package com.ssafy.lab.orak.processing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import lombok.Getter;
import lombok.Setter;

@Configuration
@EnableScheduling
@ConfigurationProperties(prefix = "processing")
@Getter
@Setter
public class ProcessingConfig {
    
    // 배치 처리 설정
    private Batch batch = new Batch();
    
    // 오디오 처리 설정
    private Audio audio = new Audio();
    
    // 이미지 처리 설정
    private Image image = new Image();
    
    @Getter
    @Setter
    public static class Batch {
        private boolean enabled = true;
        private int maxConcurrentJobs = 3;
        private int batchSize = 5;
        private String cronExpression = "0 */1 * * * *"; // 1분마다
        private int retryAttempts = 3;
        private long retryDelayMs = 5000;
    }
    
    @Getter
    @Setter
    public static class Audio {
        private boolean sttEnabled = true;
        private boolean formatConversionEnabled = true;
        private boolean metadataExtractionEnabled = true;
        private int maxProcessingTimeMinutes = 10;
        private String[] supportedFormats = {"mp3", "wav", "m4a", "flac", "aac", "ogg"};
    }
    
    @Getter
    @Setter
    public static class Image {
        private boolean optimizationEnabled = true;
        private boolean thumbnailGenerationEnabled = true;
        private int maxWidthPx = 1920;
        private int maxHeightPx = 1080;
        private int thumbnailSizePx = 300;
    }
}