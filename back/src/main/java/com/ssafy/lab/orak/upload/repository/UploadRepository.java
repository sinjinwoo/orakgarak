package com.ssafy.lab.orak.upload.repository;

import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UploadRepository extends JpaRepository<Upload, Long> {
    
    // 처리 상태별 조회
    Page<Upload> findByProcessingStatusOrderByCreatedAtAsc(ProcessingStatus status, Pageable pageable);
    
    // 오디오 파일 중 처리가 필요한 업로드 조회 (배치 처리용)
    @Query("SELECT u FROM Upload u WHERE " +
           "u.processingStatus = 'UPLOADED' AND " +
           "(u.contentType LIKE 'audio/%' OR " +
           " LOWER(u.extension) IN ('mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg')) " +
           "ORDER BY u.createdAt ASC")
    List<Upload> findPendingAudioProcessing(@Param("limit") int limit);
    
    // 특정 사용자의 처리 상태별 업로드 조회
    List<Upload> findByUploaderIdAndProcessingStatusOrderByCreatedAtDesc(Long uploaderId, ProcessingStatus status);
    
    // 처리 중인 파일 개수 조회
    @Query("SELECT COUNT(u) FROM Upload u WHERE u.processingStatus IN " +
           "('PROCESSING', 'CONVERTING', 'ANALYSIS_PENDING', 'IMAGE_OPTIMIZING', 'THUMBNAIL_GENERATING')")
    long countProcessingFiles();
    
    // 실패한 처리 건수 조회 (모니터링용)
    long countByProcessingStatus(ProcessingStatus status);
    
    // 특정 기간 내 처리 완료된 파일 조회
    @Query("SELECT u FROM Upload u WHERE " +
           "u.processingStatus = 'COMPLETED' AND " +
           "u.updatedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY u.updatedAt DESC")
    List<Upload> findCompletedBetween(@Param("startDate") LocalDateTime startDate, 
                                    @Param("endDate") LocalDateTime endDate);
    
    // UUID로 업로드 찾기 (S3 이벤트 처리용)
    Optional<Upload> findByUuid(String uuid);
}