package com.ssafy.lab.orak.processing.service;

import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;

public interface ProcessingJob {
    
    /**
     * 처리 작업 실행
     * @param upload 처리할 업로드 파일
     * @return 처리 성공 여부
     */
    boolean process(Upload upload);
    
    /**
     * 이 작업이 해당 업로드를 처리할 수 있는지 확인
     * @param upload 업로드 파일
     * @return 처리 가능 여부
     */
    boolean canProcess(Upload upload);
    
    /**
     * 처리 중 상태
     * @return 처리 중일 때의 상태
     */
    ProcessingStatus getProcessingStatus();
    
    /**
     * 처리 완료 후 상태
     * @return 완료 후 상태
     */
    ProcessingStatus getCompletedStatus();
    
    /**
     * 작업 우선순위 (낮을수록 높은 우선순위)
     * @return 우선순위
     */
    default int getPriority() {
        return 10;
    }
    
    /**
     * 예상 처리 시간 (밀리초)
     * @param upload 업로드 파일
     * @return 예상 처리 시간
     */
    default long getEstimatedProcessingTimeMs(Upload upload) {
        return 30000; // 기본 30초
    }
}