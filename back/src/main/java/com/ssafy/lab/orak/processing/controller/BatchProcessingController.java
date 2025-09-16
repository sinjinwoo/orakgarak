package com.ssafy.lab.orak.processing.controller;

import com.ssafy.lab.orak.processing.service.BatchProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/processing/batch")
@RequiredArgsConstructor
@Slf4j
public class BatchProcessingController {

    private final BatchProcessingService batchProcessingService;

    @GetMapping("/statistics")
    public ResponseEntity<BatchProcessingService.ProcessingStatistics> getStatistics() {
        log.info("배치 처리 통계 조회");
        BatchProcessingService.ProcessingStatistics statistics = batchProcessingService.getStatistics();
        return ResponseEntity.ok(statistics);
    }

    @PostMapping("/pause")
    public ResponseEntity<String> pauseProcessing() {
        log.info("Pausing batch processing");
        batchProcessingService.pauseProcessing();
        return ResponseEntity.ok("Batch processing paused successfully");
    }

    @PostMapping("/resume")
    public ResponseEntity<String> resumeProcessing() {
        log.info("Resuming batch processing");
        batchProcessingService.resumeProcessing();
        return ResponseEntity.ok("Batch processing resumed successfully");
    }

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerProcessing() {
        log.info("Manually triggering batch processing");
        batchProcessingService.processPendingFiles();
        return ResponseEntity.ok("Batch processing triggered successfully");
    }
}