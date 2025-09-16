package com.ssafy.lab.orak.like.service;

import com.ssafy.lab.orak.like.dto.LikeDto;
import com.ssafy.lab.orak.like.entity.Like;
import com.ssafy.lab.orak.like.repository.LikeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class LikeService {

    private final LikeRepository likeRepository;

    public void addLike(Long userId, LikeDto.Request request) {
        Long albumId = request.getAlbumId();

        if (likeRepository.existsByUserIdAndAlbumId(userId, albumId)) {
            throw new IllegalStateException("이미 좋아요를 누른 앨범입니다.");
        }

        Like like = Like.builder()
                .userId(userId)
                .albumId(albumId)
                .build();
        likeRepository.save(like);

        log.info("사용자 {}가 앨범 {}에 좋아요를 추가했습니다.", userId, albumId);

    }

    public void removeLike(Long userId, Long albumId) {
        Like like = likeRepository.findByUserIdAndAlbumId(userId, albumId)
                .orElseThrow(() -> new IllegalStateException("좋아요가 존재하지 않습니다."));

        likeRepository.delete(like);

        log.info("사용자 {}가 앨범 {}의 좋아요를 삭제했습니다.", userId, albumId);
    }

}
