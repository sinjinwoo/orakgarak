package com.ssafy.lab.orak.like.controller;


import com.ssafy.lab.orak.like.dto.LikeDto;
import com.ssafy.lab.orak.like.service.LikeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/social/albums")
@RequiredArgsConstructor
public class LikeController {

    private final LikeService likeService;

    @PostMapping("/{albumId}/like")
    public ResponseEntity<Void> addLike(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long albumId) {
        LikeDto.Request request = LikeDto.Request.builder()
                .albumId(albumId)
                .build();

        likeService.addLike(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/{albumId}/like")
    public ResponseEntity<Void> removeLike(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long albumId) {
        likeService.removeLike(userId, albumId);

        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}

