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

    @Query("SELECT a FROM AiDemoApplication a WHERE a.userId = :userId ORDER BY a.createdAt DESC")
    List<AiDemoApplication> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT a FROM AiDemoApplication a WHERE a.status = :status ORDER BY a.createdAt ASC")
    List<AiDemoApplication> findByStatusOrderByCreatedAtAsc(@Param("status") ApplicationStatus status);

    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN true ELSE false END FROM ai_demo_applications a WHERE a.user_id = :userId AND JSON_OVERLAPS(a.record_ids, CAST(:recordIds AS JSON))", nativeQuery = true)
    boolean existsByUserIdAndRecordIdsOverlap(@Param("userId") Long userId, @Param("recordIds") String recordIds);

    @Query("SELECT COUNT(a) FROM AiDemoApplication a WHERE a.userId = :userId AND a.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ApplicationStatus status);
}