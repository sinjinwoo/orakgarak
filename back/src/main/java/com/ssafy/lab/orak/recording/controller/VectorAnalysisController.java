package com.ssafy.lab.orak.recording.controller;

import com.ssafy.lab.orak.ai.service.VectorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 벡터 분석 관리 컨트롤러
 * - 벡터 분석 통계 조회만 제공 (VectorService로 통합됨)
 */
@RestController
@RequestMapping("/vector-analysis")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Vector Analysis", description = "벡터 분석 관리 API")
public class VectorAnalysisController {

    private final VectorService vectorService;

    /**
     * 벡터 분석 통계 조회
     */
    @GetMapping("/stats")
    @Operation(summary = "벡터 분석 통계 조회", description = "벡터 분석 진행 현황과 통계를 조회합니다.")
    public ResponseEntity<VectorService.VectorAnalysisStatistics> getVectorAnalysisStatistics() {
        log.info("GET /api/vector-analysis/stats - 벡터 분석 통계 조회");

        VectorService.VectorAnalysisStatistics stats = vectorService.getVectorAnalysisStatistics();
        return ResponseEntity.ok(stats);
    }

}