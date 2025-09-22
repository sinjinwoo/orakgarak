package com.ssafy.lab.orak.ai.service;

import com.ssafy.lab.orak.ai.dto.RecordDataDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
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
        log.info("Requesting voice image generation for {} records to URL: {}", request.records().size(), pythonServiceUrl + "/ai/generate-voice-image");

        // 각 레코드의 URL 로깅 (첫 50자만)
        request.records().forEach(record ->
            log.info("Record {}: title='{}', url='{}'", record.id(), record.title(),
                record.url() != null && record.url().length() > 50 ? record.url().substring(0, 50) + "..." : record.url())
        );

        return webClient.post()
                .uri("/ai/generate-voice-image")
                .bodyValue(request)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(),
                    clientResponse -> {
                        log.error("Client error when calling Python AI service: {}",
                            clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Error response body: {}", errorBody);
                                    return Mono.error(new RuntimeException("Python AI service client error: " + errorBody));
                                });
                    })
                .onStatus(status -> status.is5xxServerError(),
                    clientResponse -> {
                        log.error("Server error when calling Python AI service: {}",
                            clientResponse.statusCode());
                        return Mono.error(new RuntimeException("Python AI service server error"));
                    })
                .bodyToMono(VoiceImageGenerationResponseDto.class)
                .doOnNext(response -> {
                    if (response.success()) {
                        log.info("Voice image generation successful, image data length: {}",
                            response.imageBase64() != null ? response.imageBase64().length() : 0);
                    } else {
                        log.warn("Voice image generation failed: {}", response.error());
                    }
                })
                .doOnError(error -> log.error("Error calling Python AI service at {}: {}", pythonServiceUrl, error.getMessage(), error));
    }

    public Mono<JsonNode> getVoiceRecommendations(String s3Url, Integer topN) {
        log.info("Requesting voice recommendations for S3 URL: {}, topN: {}", s3Url, topN);

        var requestBody = java.util.Map.of(
                "s3_url", s3Url,
                "top_n", topN != null ? topN : 10
        );

        return webClient.post()
                .uri("/ai/voice-recommendation")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(),
                    clientResponse -> {
                        log.error("Client error when calling Python voice recommendation service: {}",
                            clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Error response body: {}", errorBody);
                                    return Mono.error(new RuntimeException("Python voice recommendation service client error: " + errorBody));
                                });
                    })
                .onStatus(status -> status.is5xxServerError(),
                    clientResponse -> {
                        log.error("Server error when calling Python voice recommendation service: {}",
                            clientResponse.statusCode());
                        return Mono.error(new RuntimeException("Python voice recommendation service server error"));
                    })
                .bodyToMono(JsonNode.class)
                .doOnNext(response -> log.info("Voice recommendation successful"))
                .doOnError(error -> log.error("Error calling Python voice recommendation service at {}: {}", pythonServiceUrl, error.getMessage(), error));
    }
}