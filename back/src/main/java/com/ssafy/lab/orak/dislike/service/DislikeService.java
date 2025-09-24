package com.ssafy.lab.orak.dislike.service;

import com.ssafy.lab.orak.dislike.entity.Dislike;
import com.ssafy.lab.orak.dislike.repository.DislikeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DislikeService {

    private final DislikeRepository dislikeRepository;

    /**
     * 싫어요 추가 또는 제거 (토글)
     */
    @Transactional
    public boolean toggleDislike(Long userId, Long songId) {
        if (dislikeRepository.existsByUserIdAndSongId(userId, songId)) {
            // 이미 dislike가 존재하면 삭제
            dislikeRepository.deleteByUserIdAndSongId(userId, songId);
            log.info("사용자 {}가 곡 {}의 싫어요를 취소했습니다.", userId, songId);
            return false; // 싫어요 취소됨
        } else {
            // dislike가 없으면 추가
            Dislike dislike = Dislike.builder()
                    .userId(userId)
                    .songId(songId)
                    .build();
            dislikeRepository.save(dislike);
            log.info("사용자 {}가 곡 {}에 싫어요를 했습니다.", userId, songId);
            return true; // 싫어요 추가됨
        }
    }

    /**
     * 싫어요 추가
     */
    @Transactional
    public void addDislike(Long userId, Long songId) {
        if (!dislikeRepository.existsByUserIdAndSongId(userId, songId)) {
            Dislike dislike = Dislike.builder()
                    .userId(userId)
                    .songId(songId)
                    .build();
            dislikeRepository.save(dislike);
            log.info("사용자 {}가 곡 {}에 싫어요를 했습니다.", userId, songId);
        }
    }

    /**
     * 싫어요 제거
     */
    @Transactional
    public void removeDislike(Long userId, Long songId) {
        if (dislikeRepository.existsByUserIdAndSongId(userId, songId)) {
            dislikeRepository.deleteByUserIdAndSongId(userId, songId);
            log.info("사용자 {}가 곡 {}의 싫어요를 취소했습니다.", userId, songId);
        }
    }

    /**
     * 싫어요 여부 확인
     */
    public boolean isDisliked(Long userId, Long songId) {
        return dislikeRepository.existsByUserIdAndSongId(userId, songId);
    }

    /**
     * 사용자가 싫어요한 곡 ID 목록 조회
     */
    public List<Long> getUserDislikedSongIds(Long userId) {
        return dislikeRepository.findSongIdsByUserId(userId);
    }

    /**
     * 사용자의 모든 싫어요 조회
     */
    public List<Dislike> getUserDislikes(Long userId) {
        return dislikeRepository.findByUserId(userId);
    }

    /**
     * 곡의 총 싫어요 수 조회
     */
    public long getDislikeCount(Long songId) {
        return dislikeRepository.countBySongId(songId);
    }
}