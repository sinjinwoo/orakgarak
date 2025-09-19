package com.ssafy.lab.orak.processing.controller;

import com.ssafy.lab.orak.processing.service.BatchProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/processing/batch")
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
        log.info("[배치] 배치 처리 일시 정지 요청");
        batchProcessingService.pauseProcessing();
        return ResponseEntity.ok("배치 처리가 성공적으로 일시 정지되었습니다");
    }

    @PostMapping("/resume")
    public ResponseEntity<String> resumeProcessing() {
        log.info("[배치] 배치 처리 재개 요청");
        batchProcessingService.resumeProcessing();
        return ResponseEntity.ok("배치 처리가 성공적으로 재개되었습니다");
    }

    @PostMapping("/trigger")
    public ResponseEntity<String> triggerProcessing() {
        log.info("[배치] 수동 배치 처리 실행 요청");
        batchProcessingService.processPendingFiles();
        return ResponseEntity.ok("배치 처리가 성공적으로 실행되었습니다");
    }
}