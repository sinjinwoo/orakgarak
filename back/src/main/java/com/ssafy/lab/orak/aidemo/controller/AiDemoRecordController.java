package com.ssafy.lab.orak.aidemo.controller;

import com.ssafy.lab.orak.aidemo.service.AiDemoRecordService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@RestController
@RequestMapping("/ai-demo/records")
@RequiredArgsConstructor
@Log4j2
@Validated
public class AiDemoRecordController {

    private final AiDemoRecordService aiDemoRecordService;

    // AI 데모 파일 업로드 (관리자 전용)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RecordResponseDTO> createAiDemoRecord(
            @RequestParam("audioFile") @NotNull MultipartFile audioFile,
            @RequestParam("title") @NotBlank String title,
            @RequestParam("targetUserId") @NotNull Long targetUserId) {

        RecordResponseDTO response = aiDemoRecordService.createAiDemoRecord(title, audioFile, targetUserId);
        return ResponseEntity.ok(response);
    }

    // 내 AI 데모 파일 조회
    @GetMapping("/me")
    public ResponseEntity<List<RecordResponseDTO>> getMyAiDemoRecords(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        List<RecordResponseDTO> response = aiDemoRecordService.getAiDemoRecords(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    // 특정 사용자의 AI 데모 파일 조회 (관리자 전용)
    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RecordResponseDTO>> getUserAiDemoRecords(
            @PathVariable @NotNull Long userId) {

        List<RecordResponseDTO> response = aiDemoRecordService.getAiDemoRecords(userId);
        return ResponseEntity.ok(response);
    }

    // 모든 AI 데모 파일 조회 (관리자 전용)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RecordResponseDTO>> getAllAiDemoRecords() {
        List<RecordResponseDTO> response = aiDemoRecordService.getAllAiDemoRecords();
        return ResponseEntity.ok(response);
    }
}