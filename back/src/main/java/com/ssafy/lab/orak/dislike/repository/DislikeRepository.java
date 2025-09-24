package com.ssafy.lab.orak.dislike.repository;

import com.ssafy.lab.orak.dislike.entity.Dislike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DislikeRepository extends JpaRepository<Dislike, Long> {

    /**
     * 특정 사용자와 곡의 dislike 존재 여부 확인
     */
    boolean existsByUserIdAndSongId(Long userId, Long songId);

    /**
     * 특정 사용자와 곡의 dislike 조회
     */
    Optional<Dislike> findByUserIdAndSongId(Long userId, Long songId);

    /**
     * 특정 사용자가 dislike한 모든 곡 ID 목록 조회
     */
    @Query("SELECT d.songId FROM Dislike d WHERE d.userId = :userId")
    List<Long> findSongIdsByUserId(@Param("userId") Long userId);

    /**
     * 특정 사용자의 모든 dislike 조회
     */
    List<Dislike> findByUserId(Long userId);

    /**
     * 특정 곡의 총 dislike 수 조회
     */
    long countBySongId(Long songId);

    /**
     * 특정 사용자와 곡의 dislike 삭제
     */
    void deleteByUserIdAndSongId(Long userId, Long songId);
}