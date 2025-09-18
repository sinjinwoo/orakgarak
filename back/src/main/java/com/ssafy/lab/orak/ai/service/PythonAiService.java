package com.ssafy.lab.orak.ai.service;

import com.ssafy.lab.orak.ai.dto.RecordDataDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class PythonAiService {

    @Qualifier("pythonWebClient")
    private final WebClient webClient;

    @Value("${python.service.url}")
    private String pythonServiceUrl;

    public Mono<Boolean> healthCheck() {
        return webClient.get()
                .uri("/ai/health")
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> response.contains("ok"))
                .doOnNext(result -> log.info("Python AI service health check: {}", result))
                .doOnError(error -> log.error("Python AI service health check failed", error))
                .onErrorReturn(false);
    }

    public Mono<VoiceImageGenerationResponseDto> generateVoiceImage(List<RecordDataDto> records) {
        return generateVoiceImage(new VoiceImageGenerationRequestDto(records));
    }

    public Mono<VoiceImageGenerationResponseDto> generateVoiceImage(VoiceImageGenerationRequestDto request) {
        log.info("Requesting voice image generation for {} records", request.records().size());

        return webClient.post()
                .uri("/ai/generate-voice-image")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(VoiceImageGenerationResponseDto.class)
                .doOnNext(response -> {
                    if (response.success()) {
                        log.info("Voice image generation successful");
                    } else {
                        log.warn("Voice image generation failed: {}", response.error());
                    }
                })
                .doOnError(error -> log.error("Error calling Python AI service", error));
    }
}