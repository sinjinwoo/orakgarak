package com.ssafy.lab.orak.ai.controller;

import com.ssafy.lab.orak.ai.dto.SimilarVoiceRecommendationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationResponseDto;
import com.ssafy.lab.orak.ai.service.VectorService;
import com.ssafy.lab.orak.ai.service.VoiceRecommendationService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Log4j2
@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Voice Recommendation API", description = "음성 기반 음악 추천 API")
public class VoiceRecommendationController {

    private final VoiceRecommendationService voiceRecommendationService;
    private final VectorService vectorService;
    @PostMapping("/song")
    @Operation(summary = "음성 기반 음악 추천", description = "업로드된 음성 파일을 분석하여 유사한 음악을 추천합니다.")
    public ResponseEntity<VoiceRecommendationResponseDto> getVoiceRecommendations(
            @RequestBody @Valid VoiceRecommendationRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("POST /api/ai/voice-recommendation - User: {}, Upload ID: {}, Top N: {}",
                userId, request.uploadId(), request.topN());

        try {
            VoiceRecommendationResponseDto response = voiceRecommendationService
                    .getVoiceRecommendations(userId, request)
                    .block();

            log.info("Voice recommendation completed for user: {} - Status: {}", userId, response.status());
            return ResponseEntity.status(HttpStatus.OK).body(response);

        } catch (Exception error) {
            log.error("Error processing voice recommendation for user: {}", userId, error);

            VoiceRecommendationResponseDto errorResponse = VoiceRecommendationResponseDto.builder()
                    .status("error")
                    .message("음성 추천 처리 중 오류가 발생했습니다: " + error.getMessage())
                    .recommendations(java.util.Collections.emptyList())
                    .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/similar-voice")
    @Operation(summary = "유사 목소리 기반 음악 추천", description = "목소리가 유사한 다른 사용자들이 부른 노래를 추천합니다.")
    public ResponseEntity<VoiceRecommendationResponseDto> getSimilarVoiceRecommendations(
            @RequestBody @Valid SimilarVoiceRecommendationRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("POST /api/vectors/similar-voice - User: {}, Upload ID: {}, Top N: {}",
                userId, request.uploadId(), request.topN());

        try {
            VoiceRecommendationResponseDto response = vectorService
                    .getSimilarVoiceRecommendations(userId, request)
                    .block();

            log.info("Similar voice recommendation completed for user: {} - Status: {}", userId, response.status());
            return ResponseEntity.status(HttpStatus.OK).body(response);

        } catch (Exception error) {
            log.error("Error processing similar voice recommendation for user: {}", userId, error);

            VoiceRecommendationResponseDto errorResponse = VoiceRecommendationResponseDto.builder()
                    .status("error")
                    .message("유사 목소리 추천 처리 중 오류가 발생했습니다: " + error.getMessage())
                    .recommendations(java.util.Collections.emptyList())
                    .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}