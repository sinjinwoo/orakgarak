package com.ssafy.lab.orak.recording.controller;

import com.ssafy.lab.orak.auth.service.CustomUserPrincipal;
import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.service.RecordService;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@Log4j2
@Validated
public class RecordController {
    
    private final RecordService recordService;
    private final FileUploadService fileUploadService;

    //녹음파일 생성 -> 토큰에서 userID 추출
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecordResponseDTO> createRecord(
            @RequestParam("audioFile") @NotNull MultipartFile audioFile,
            @RequestParam("title") @NotBlank String title,
            @RequestParam(value = "songId", required = false) Long songId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        
        RecordResponseDTO response = recordService.createRecord(title, songId, audioFile, principal.getUserId());
        return ResponseEntity.ok(response);
    }

    //특정 녹음 파일 조회
    @GetMapping("/{recordId}")
    public ResponseEntity<RecordResponseDTO> getRecord(@PathVariable Long recordId) {
        RecordResponseDTO response = recordService.getRecord(recordId);
        return ResponseEntity.ok(response);
    }

    //내 녹음 파일 조회(토큰에서 userID 추출)
    @GetMapping("/me")
    public ResponseEntity<List<RecordResponseDTO>> getMyRecords(@AuthenticationPrincipal CustomUserPrincipal principal) {
        List<RecordResponseDTO> response = recordService.getRecordsByUser(principal.getUserId());
        return ResponseEntity.ok(response);
    }

    //특정 곡의 녹음 파일 목록 조회
    @GetMapping("/song/{songId}")
    public ResponseEntity<List<RecordResponseDTO>> getRecordsBySong(@PathVariable Long songId) {
        List<RecordResponseDTO> response = recordService.getRecordsBySong(songId);
        return ResponseEntity.ok(response);
    }

    //녹음 파일 수정 ( 토큰에서 userID 추출)
    @PutMapping(value = "/{recordId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecordResponseDTO> updateRecord(
            @PathVariable Long recordId,
            @RequestParam("title") String title,
            @RequestParam(value = "audioFile", required = false) MultipartFile audioFile,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        
        RecordResponseDTO response = recordService.updateRecord(recordId, title, audioFile, principal.getUserId());
        return ResponseEntity.ok(response);
    }

    //녹음 파일 삭제(토큰에서 userID 추출)
    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteRecord(
            @PathVariable Long recordId,
            @AuthenticationPrincipal CustomUserPrincipal principal) {
        
        recordService.deleteRecord(recordId, principal.getUserId());
        return ResponseEntity.noContent().build();
    }

}