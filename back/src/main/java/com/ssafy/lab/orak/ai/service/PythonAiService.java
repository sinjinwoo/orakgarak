package com.ssafy.lab.orak.ai.service;

import com.ssafy.lab.orak.ai.dto.RecordDataDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceImageGenerationResponseDto;
import com.ssafy.lab.orak.ai.dto.PineconeMetadataGenerationRequestDto;
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

    public Mono<JsonNode> getVoiceRecommendations(Long userId, String uploadId, Integer topN) {
        log.info("Requesting voice recommendations for user: {}, uploadId: {}, topN: {}", userId, uploadId, topN);

        var requestBody = java.util.Map.of(
                "user_id", userId,
                "upload_id", uploadId,
                "top_n", topN != null ? topN : 5
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

    public Mono<JsonNode> saveUserVector(String s3Url, Long userId, String uploadId, Long songId) {
        log.info("Requesting save user vector for S3 URL: {}, userId: {}, uploadId: {}, songId: {}", s3Url, userId, uploadId, songId);

        var requestBodyBuilder = java.util.Map.<String, Object>of(
                "s3_url", s3Url,
                "user_id", userId,
                "upload_id", uploadId != null ? uploadId : ""
        );

        // songId가 있는 경우에만 추가
        var requestBody = new java.util.HashMap<>(requestBodyBuilder);
        if (songId != null) {
            requestBody.put("song_id", songId);
        }

        return webClient.post()
                .uri("/ai/save-user-vector")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(),
                    clientResponse -> {
                        log.error("Client error when calling Python save user vector service: {}",
                            clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Error response body: {}", errorBody);
                                    return Mono.error(new RuntimeException("Python save user vector service client error: " + errorBody));
                                });
                    })
                .onStatus(status -> status.is5xxServerError(),
                    clientResponse -> {
                        log.error("Server error when calling Python save user vector service: {}",
                            clientResponse.statusCode());
                        return Mono.error(new RuntimeException("Python save user vector service server error"));
                    })
                .bodyToMono(JsonNode.class)
                .doOnNext(response -> log.info("Save user vector successful"))
                .doOnError(error -> log.error("Error calling Python save user vector service at {}: {}", pythonServiceUrl, error.getMessage(), error));
    }

    public Mono<JsonNode> getSimilarVoiceRecommendations(Long userId, String uploadId, Integer topN) {
        log.info("Requesting similar voice recommendations for user: {}, uploadId: {}, topN: {}", userId, uploadId, topN);

        var requestBody = java.util.Map.of(
                "user_id", userId,
                "upload_id", uploadId,
                "top_n", topN != null ? topN : 5
        );

        return webClient.post()
                .uri("/ai/similar-voice-recommendation")
                .bodyValue(requestBody)
                .retrieve()
                .onStatus(status -> status.is4xxClientError(),
                    clientResponse -> {
                        log.error("Client error when calling Python similar voice recommendation service: {}",
                            clientResponse.statusCode());
                        return clientResponse.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Error response body: {}", errorBody);
                                    return Mono.error(new RuntimeException("Python similar voice recommendation service client error: " + errorBody));
                                });
                    })
                .onStatus(status -> status.is5xxServerError(),
                    clientResponse -> {
                        log.error("Server error when calling Python similar voice recommendation service: {}",
                            clientResponse.statusCode());
                        return Mono.error(new RuntimeException("Python similar voice recommendation service server error"));
                    })
                .bodyToMono(JsonNode.class)
                .doOnNext(response -> log.info("Similar voice recommendation successful"))
                .doOnError(error -> log.error("Error calling Python similar voice recommendation service at {}: {}", pythonServiceUrl, error.getMessage(), error));
    }
}