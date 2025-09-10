package com.ssafy.lab.orak.recording.repository;

import com.ssafy.lab.orak.recording.entity.Record;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecordRepository extends JpaRepository<Record, Long> {
    
    List<Record> findByUserId(Long userId);
    
    List<Record> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Record> findBySongId(Long songId);
    
    @Query("SELECT r FROM Record r JOIN FETCH r.upload WHERE r.userId = :userId")
    List<Record> findByUserIdWithUpload(@Param("userId") Long userId);
    
    @Query("SELECT r FROM Record r JOIN FETCH r.upload WHERE r.id = :recordId")
    Record findByIdWithUpload(@Param("recordId") Long recordId);
    
    @Query("SELECT COUNT(r) FROM Record r WHERE r.userId = :userId")
    Long countByUserId(@Param("userId") Long userId);
}