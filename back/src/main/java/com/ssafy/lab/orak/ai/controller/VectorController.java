package com.ssafy.lab.orak.ai.controller;

import com.ssafy.lab.orak.ai.dto.SaveUserVectorRequestDto;
import com.ssafy.lab.orak.ai.dto.SaveUserVectorResponseDto;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationResponseDto;
import com.ssafy.lab.orak.ai.service.VectorService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.service.RecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping("/vectors")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Vector API", description = "음성 벡터 관리 API")
public class VectorController {

    private final VectorService vectorService;
    private final RecordService recordService;
    @PostMapping("/save")
    @Operation(summary = "사용자 음성 벡터 저장", description = "업로드된 음성 파일을 분석하여 벡터 DB에 저장합니다.")
    public ResponseEntity<SaveUserVectorResponseDto> saveUserVector(
            @RequestBody @Valid SaveUserVectorRequestDto request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        Long userId = principal.getUserId();
        log.info("POST /api/vectors/save - User: {}, Record ID: {}", userId, request.recordId());

        try {
            RecordResponseDTO record = recordService.getRecord(request.recordId());

            // 비동기로 벡터 처리 시작
            vectorService.processRecordVectorAsync(userId, record.getUploadId(), record.getSongId());

            // 즉시 응답 반환 (비동기 처리 중)
            SaveUserVectorResponseDto response = SaveUserVectorResponseDto.builder()
                    .status("processing")
                    .message("사용자 음성 벡터 처리가 시작되었습니다.")
                    .vectorId(null)  // 비동기 처리 중이므로 아직 없음
                    .userId(userId)
                    .uploadId(String.valueOf(record.getUploadId()))
                    .voiceAnalysis(null)  // 비동기 처리 완료 후 생성
                    .build();

            log.info("Async vector processing started for user: {}, uploadId: {}, songId: {}",
                    userId, record.getUploadId(), record.getSongId());

            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);

        } catch (Exception error) {
            log.error("Error starting async vector processing for user: {}", userId, error);

            SaveUserVectorResponseDto errorResponse = SaveUserVectorResponseDto.builder()
                    .status("error")
                    .message("사용자 벡터 처리 시작 중 오류가 발생했습니다: " + error.getMessage())
                    .vectorId(null)
                    .userId(userId)
                    .uploadId(null)
                    .voiceAnalysis(null)
                    .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }


}