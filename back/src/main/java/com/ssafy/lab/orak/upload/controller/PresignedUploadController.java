package com.ssafy.lab.orak.upload.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.upload.dto.PresignedUploadRequest;
import com.ssafy.lab.orak.upload.dto.PresignedUploadResponse;
import com.ssafy.lab.orak.upload.service.PresignedUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/uploads")
@RequiredArgsConstructor
@Slf4j
public class PresignedUploadController {

    private final PresignedUploadService presignedUploadService;

    @PostMapping("/presigned-url")
    public ResponseEntity<PresignedUploadResponse> generatePresignedUploadUrl(
            @RequestBody PresignedUploadRequest request,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        
        log.info("Generating presigned upload URL for file: {} (user: {})", 
                request.getOriginalFilename(), principal.getUser().getId());
        
        PresignedUploadResponse response = presignedUploadService
                .generatePresignedUploadUrl(request, principal.getUser().getId());
        
        return ResponseEntity.ok(response);
    }
}