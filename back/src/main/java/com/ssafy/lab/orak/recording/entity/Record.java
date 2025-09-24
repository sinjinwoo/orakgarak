package com.ssafy.lab.orak.recording.entity;

import com.ssafy.lab.orak.common.entity.BaseEntity;
import com.ssafy.lab.orak.recording.enums.VectorAnalysisStatus;
import com.ssafy.lab.orak.upload.entity.Upload;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "records")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class Record extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long songId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Long uploadId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploadId", insertable = false, updatable = false)
    private Upload upload;

    private Integer durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "vector_analysis_status")
    @Builder.Default
    @Setter
    private VectorAnalysisStatus vectorAnalysisStatus = VectorAnalysisStatus.PENDING;

    @Column(name = "vector_analysis_error_message")
    @Setter
    private String vectorAnalysisErrorMessage;

    @Column(name = "vector_analysis_retry_count")
    @Builder.Default
    @Setter
    private Integer vectorAnalysisRetryCount = 0;

    @Column(name = "vector_analysis_last_failed_at")
    @Setter
    private java.time.LocalDateTime vectorAnalysisLastFailedAt;

    // 편의 메서드: 벡터 분석 상태 업데이트
    public void updateVectorAnalysisStatus(VectorAnalysisStatus status) {
        this.vectorAnalysisStatus = status;
        this.vectorAnalysisErrorMessage = null; // 성공 시 에러 메시지 클리어
    }

    // 편의 메서드: 벡터 분석 실패 시 상태 업데이트
    public void markVectorAnalysisFailed(String errorMessage) {
        this.vectorAnalysisStatus = VectorAnalysisStatus.FAILED;
        this.vectorAnalysisErrorMessage = errorMessage;
    }

    // 편의 메서드: 벡터 분석 재시도 가능한 실패로 마킹
    public void markVectorAnalysisRetryableFailure(String errorMessage) {
        this.vectorAnalysisRetryCount = (this.vectorAnalysisRetryCount == null) ? 1 : this.vectorAnalysisRetryCount + 1;
        this.vectorAnalysisLastFailedAt = java.time.LocalDateTime.now();
        this.vectorAnalysisErrorMessage = errorMessage;
        this.vectorAnalysisStatus = VectorAnalysisStatus.PENDING; // 재시도를 위해 PENDING으로 설정
    }

    // 편의 메서드: 벡터 분석 최대 재시도 횟수 초과 확인
    public boolean isVectorAnalysisMaxRetryExceeded(int maxRetries) {
        return this.vectorAnalysisRetryCount != null && this.vectorAnalysisRetryCount >= maxRetries;
    }

    // 편의 메서드: 벡터 분석 재시도 가능 시간 확인
    public boolean canVectorAnalysisRetryAfterDelay(long retryDelayMs) {
        if (this.vectorAnalysisLastFailedAt == null) return true;
        return java.time.LocalDateTime.now()
                .isAfter(this.vectorAnalysisLastFailedAt.plusNanos(retryDelayMs * 1_000_000));
    }

    // 편의 메서드: 벡터 분석 재시도 카운터 리셋 (성공 시)
    public void resetVectorAnalysisRetryCount() {
        this.vectorAnalysisRetryCount = 0;
        this.vectorAnalysisLastFailedAt = null;
    }

    // 편의 메서드: 벡터 분석 필요 여부 확인
    public boolean needsVectorAnalysis() {
        return this.vectorAnalysisStatus.needsProcessing() &&
               this.upload != null &&
               this.upload.getProcessingStatus().isPlayable();
    }
}
