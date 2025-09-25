package com.ssafy.lab.orak.aidemo.controller;

import com.ssafy.lab.orak.aidemo.dto.AdminUpdateRequestDTO;
import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationRequestDTO;
import com.ssafy.lab.orak.aidemo.dto.AiDemoApplicationResponseDTO;
import com.ssafy.lab.orak.aidemo.enums.ApplicationStatus;
import com.ssafy.lab.orak.aidemo.service.AiDemoApplicationService;
import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@RestController
@RequestMapping("/ai-demo/applications")
@RequiredArgsConstructor
@Log4j2
@Validated
public class AiDemoApplicationController {

    private final AiDemoApplicationService aiDemoApplicationService;

    // AI 데모 신청 생성
    @PostMapping
    public ResponseEntity<AiDemoApplicationResponseDTO> createApplication(
            @Valid @RequestBody AiDemoApplicationRequestDTO requestDTO,
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        AiDemoApplicationResponseDTO response = aiDemoApplicationService.createApplication(requestDTO, principal.getUserId());
        return ResponseEntity.ok(response);
    }

    // 내 AI 데모 신청 목록 조회
    @GetMapping("/me")
    public ResponseEntity<List<AiDemoApplicationResponseDTO>> getMyApplications(
            @AuthenticationPrincipal CustomUserPrincipal principal) {

        List<AiDemoApplicationResponseDTO> response = aiDemoApplicationService.getMyApplications(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    // 특정 AI 데모 신청 조회
    @GetMapping("/{applicationId}")
    public ResponseEntity<AiDemoApplicationResponseDTO> getApplication(
            @PathVariable @NotNull Long applicationId) {

        AiDemoApplicationResponseDTO response = aiDemoApplicationService.getApplication(applicationId);
        return ResponseEntity.ok(response);
    }

    // === 관리자 전용 엔드포인트 ===

    // 상태별 AI 데모 신청 목록 조회 (관리자)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AiDemoApplicationResponseDTO>> getAllApplicationsByStatus(
            @RequestParam(defaultValue = "PENDING") ApplicationStatus status) {

        List<AiDemoApplicationResponseDTO> response = aiDemoApplicationService.getAllApplicationsByStatus(status);
        return ResponseEntity.ok(response);
    }

    // AI 데모 신청 상태 업데이트 (관리자)
    @PutMapping("/{applicationId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiDemoApplicationResponseDTO> updateApplicationStatus(
            @PathVariable @NotNull Long applicationId,
            @Valid @RequestBody AdminUpdateRequestDTO updateRequest) {

        AiDemoApplicationResponseDTO response = aiDemoApplicationService.updateApplicationStatus(applicationId, updateRequest);
        return ResponseEntity.ok(response);
    }

    // AI 데모 신청 승인 (관리자)
    @PutMapping("/{applicationId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiDemoApplicationResponseDTO> approveApplication(
            @PathVariable @NotNull Long applicationId,
            @RequestParam(required = false) String adminNote) {

        AiDemoApplicationResponseDTO response = aiDemoApplicationService.approveApplication(applicationId, adminNote);
        return ResponseEntity.ok(response);
    }

    // AI 데모 신청 거절 (관리자)
    @PutMapping("/{applicationId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiDemoApplicationResponseDTO> rejectApplication(
            @PathVariable @NotNull Long applicationId,
            @RequestParam(required = false) String adminNote) {

        AiDemoApplicationResponseDTO response = aiDemoApplicationService.rejectApplication(applicationId, adminNote);
        return ResponseEntity.ok(response);
    }

    // AI 데모 신청 완료 처리 (관리자)
    @PutMapping("/{applicationId}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiDemoApplicationResponseDTO> completeApplication(
            @PathVariable @NotNull Long applicationId,
            @RequestParam(required = false) String adminNote) {

        AiDemoApplicationResponseDTO response = aiDemoApplicationService.completeApplication(applicationId, adminNote);
        return ResponseEntity.ok(response);
    }

    // 사용자별 상태별 신청 개수 조회 (관리자)
    @GetMapping("/users/{userId}/count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> getUserApplicationCount(
            @PathVariable @NotNull Long userId,
            @RequestParam ApplicationStatus status) {

        long count = aiDemoApplicationService.countMyApplicationsByStatus(userId, status);
        return ResponseEntity.ok(count);
    }
}