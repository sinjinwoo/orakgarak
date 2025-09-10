package com.ssafy.lab.orak.recording.controller;

import com.ssafy.lab.orak.recording.dto.RecordResponseDTO;
import com.ssafy.lab.orak.recording.service.RecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@Log4j2
@Validated
public class RecordController {
    
    private final RecordService recordService;
    
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RecordResponseDTO> createRecord(
            @RequestParam("audioFile") @NotNull MultipartFile audioFile,
            @RequestParam("title") @NotBlank String title,
            @RequestParam(value = "songId", required = false) Long songId,
            @RequestParam(value = "durationSeconds", required = false) @Min(1) Integer durationSeconds,
            @RequestHeader("userId") Long userId) {
        
        RecordResponseDTO response = recordService.createRecord(title, songId, audioFile, durationSeconds, userId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{recordId}")
    public ResponseEntity<RecordResponseDTO> getRecord(@PathVariable Long recordId) {
        RecordResponseDTO response = recordService.getRecord(recordId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<RecordResponseDTO>> getRecordsByUser(@PathVariable Long userId) {
        List<RecordResponseDTO> response = recordService.getRecordsByUser(userId);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/song/{songId}")
    public ResponseEntity<List<RecordResponseDTO>> getRecordsBySong(@PathVariable Long songId) {
        List<RecordResponseDTO> response = recordService.getRecordsBySong(songId);
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{recordId}")
    public ResponseEntity<RecordResponseDTO> updateRecord(
            @PathVariable Long recordId,
            @RequestParam("title") String title,
            @RequestHeader("userId") Long userId) {
        
        RecordResponseDTO response = recordService.updateRecord(recordId, title, userId);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteRecord(
            @PathVariable Long recordId,
            @RequestHeader("userId") Long userId) {
        
        recordService.deleteRecord(recordId, userId);
        return ResponseEntity.noContent().build();
    }
}