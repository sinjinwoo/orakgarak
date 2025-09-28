package com.ssafy.lab.orak.like.service;

import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.album.repository.AlbumRepository;
import com.ssafy.lab.orak.like.dto.LikeDto;
import com.ssafy.lab.orak.like.entity.Like;
import com.ssafy.lab.orak.like.repository.LikeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Log4j2
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LikeService {

    private final LikeRepository likeRepository;
    private final AlbumRepository albumRepository;

    @Transactional
    public boolean toggleLike(Long userId, Long albumId) {
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new IllegalArgumentException("앨범을 찾을 수 없습니다: " + albumId));
        
        if (likeRepository.existsByUserIdAndAlbumId(userId, albumId)) {
            Like like = likeRepository.findByUserIdAndAlbumId(userId, albumId)
                    .orElseThrow(() -> new IllegalStateException("좋아요가 존재하지 않습니다."));
            likeRepository.delete(like);
            
            // 앨범의 좋아요 수 감소
            album.setLikeCount(Math.max(0, album.getLikeCount() - 1));
            albumRepository.save(album);
            
            log.info("사용자 {}가 앨범 {}의 좋아요를 취소했습니다. 현재 좋아요 수: {}", userId, albumId, album.getLikeCount());
            return false;
        } else {
            Like like = Like.builder()
                    .userId(userId)
                    .albumId(albumId)
                    .build();
            likeRepository.save(like);
            
            // 앨범의 좋아요 수 증가
            album.setLikeCount(album.getLikeCount() + 1);
            albumRepository.save(album);
            
            log.info("사용자 {}가 앨범 {}에 좋아요를 추가했습니다. 현재 좋아요 수: {}", userId, albumId, album.getLikeCount());
            return true;
        }
    }

    @Transactional
    public void addLike(Long userId, LikeDto.Request request) {
        Long albumId = request.getAlbumId();

        if (likeRepository.existsByUserIdAndAlbumId(userId, albumId)) {
            throw new IllegalStateException("이미 좋아요를 누른 앨범입니다.");
        }

        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new IllegalArgumentException("앨범을 찾을 수 없습니다: " + albumId));

        Like like = Like.builder()
                .userId(userId)
                .albumId(albumId)
                .build();
        likeRepository.save(like);

        // 앨범의 좋아요 수 증가
        album.setLikeCount(album.getLikeCount() + 1);
        albumRepository.save(album);

        log.info("사용자 {}가 앨범 {}에 좋아요를 추가했습니다. 현재 좋아요 수: {}", userId, albumId, album.getLikeCount());
    }

    @Transactional
    public void removeLike(Long userId, Long albumId) {
        Like like = likeRepository.findByUserIdAndAlbumId(userId, albumId)
                .orElseThrow(() -> new IllegalStateException("좋아요가 존재하지 않습니다."));

        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new IllegalArgumentException("앨범을 찾을 수 없습니다: " + albumId));

        likeRepository.delete(like);

        // 앨범의 좋아요 수 감소
        album.setLikeCount(Math.max(0, album.getLikeCount() - 1));
        albumRepository.save(album);

        log.info("사용자 {}가 앨범 {}의 좋아요를 삭제했습니다. 현재 좋아요 수: {}", userId, albumId, album.getLikeCount());
    }

    public boolean isLiked(Long userId, Long albumId) {
        return likeRepository.existsByUserIdAndAlbumId(userId, albumId);
    }

    public long getLikeCount(Long albumId) {
        return likeRepository.countByAlbumId(albumId);
    }

}
