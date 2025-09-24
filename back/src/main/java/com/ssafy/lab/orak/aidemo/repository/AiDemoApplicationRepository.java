package com.ssafy.lab.orak.aidemo.repository;

import com.ssafy.lab.orak.aidemo.entity.AiDemoApplication;
import com.ssafy.lab.orak.aidemo.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiDemoApplicationRepository extends JpaRepository<AiDemoApplication, Long> {

    @Query("SELECT a FROM AiDemoApplication a JOIN FETCH a.record WHERE a.userId = :userId ORDER BY a.createdAt DESC")
    List<AiDemoApplication> findByUserIdWithRecord(@Param("userId") Long userId);

    List<AiDemoApplication> findByStatusOrderByCreatedAtAsc(ApplicationStatus status);

    @Query("SELECT a FROM AiDemoApplication a JOIN FETCH a.record WHERE a.status = :status ORDER BY a.createdAt ASC")
    List<AiDemoApplication> findByStatusWithRecord(@Param("status") ApplicationStatus status);

    Optional<AiDemoApplication> findByUserIdAndRecordId(Long userId, Long recordId);

    boolean existsByUserIdAndRecordId(Long userId, Long recordId);

    @Query("SELECT COUNT(a) FROM AiDemoApplication a WHERE a.userId = :userId AND a.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ApplicationStatus status);

    @Query("SELECT a FROM AiDemoApplication a JOIN FETCH a.record WHERE a.id = :id")
    Optional<AiDemoApplication> findByIdWithRecord(@Param("id") Long id);
}