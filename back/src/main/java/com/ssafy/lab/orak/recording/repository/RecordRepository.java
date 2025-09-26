package com.ssafy.lab.orak.recording.repository;

import com.ssafy.lab.orak.recording.entity.Record;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecordRepository extends JpaRepository<Record, Long> {
    List<Record> findBySongId(Long songId);

    @Query("SELECT r FROM Record r JOIN FETCH r.upload WHERE r.userId = :userId")
    List<Record> findByUserIdWithUpload(@Param("userId") Long userId);

    @Query("SELECT r FROM Record r JOIN FETCH r.upload WHERE r.id = :recordId")
    Optional<Record> findByIdWithUpload(@Param("recordId") Long recordId);

    // 비동기 처리를 위한 uploadId 기반 조회
    Optional<Record> findByUploadId(Long uploadId);

    // uploadId 존재 여부 확인
    boolean existsByUploadId(Long uploadId);

    // 배치 처리를 위한 PENDING 상태 Record 조회
    @Query("SELECT r FROM Record r JOIN FETCH r.upload u WHERE u.processingStatus = :status ORDER BY r.createdAt ASC")
    List<Record> findPendingWithUpload(@Param("status") ProcessingStatus status, org.springframework.data.domain.Pageable pageable);

    // 디렉토리별 조회 
    @Query("SELECT r FROM Record r JOIN FETCH r.upload u WHERE r.userId = :userId AND u.directory = :directory")
    List<Record> findByUserAndDirectory(@Param("userId") Long userId, @Param("directory") String directory);

    @Query("SELECT r FROM Record r JOIN FETCH r.upload u WHERE u.directory = :directory")
    List<Record> findByDirectory(@Param("directory") String directory);

}