package com.ssafy.lab.orak.comment.controller;

import com.ssafy.lab.orak.comment.dto.CommentDto;
import com.ssafy.lab.orak.comment.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
@Tag(name = "댓글 API", description = "댓글 및 대댓글 CRUD")
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/albums/{albumId}/comments")
    @Operation(summary = "앨범 댓글 조회", description = "특정 앨범의 댓글 목록을 페이지네이션으로 조회합니다.")
    public ResponseEntity<Page<CommentDto.Response>> getComments(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            Pageable pageable) {
        Page<CommentDto.Response> comments = commentService.getCommentsByAlbumId(albumId, pageable);
        return ResponseEntity.ok(comments);
    }

    @PostMapping("/albums/{albumId}/comments")
    @Operation(summary = "앨범에 댓글 작성", description = "특정 앨범에 댓글을 생성합니다.")
    public ResponseEntity<Void> createComment(
            @Parameter(description = "앨범 ID") @PathVariable Long albumId,
            @RequestHeader("User-Id") Long userId,
            @Valid @RequestBody CommentDto.CreateRequest request) {
        commentService.createComment(userId, albumId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/comments/{commentId}")
    @Operation(summary = "댓글 수정", description = "댓글을 수정합니다.")
    public ResponseEntity<Void> updateComment(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @RequestHeader("User-Id") Long userId,
            @Valid @RequestBody CommentDto.UpdateRequest request) {
        commentService.updateComment(userId, commentId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "댓글 삭제", description = "댓글을 삭제합니다.")
    public ResponseEntity<Void> deleteComment(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @RequestHeader("User-Id") Long userId) {
        commentService.deleteComment(userId, commentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/comments/{commentId}/reply")
    @Operation(summary = "대댓글 조회", description = "특정 댓글의 대댓글 목록을 조회합니다.")
    public ResponseEntity<List<CommentDto.Response>> getReplies(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId) {
        List<CommentDto.Response> replies = commentService.getRepliesByCommentId(commentId);
        return ResponseEntity.ok(replies);
    }

    @PostMapping("/comments/{commentId}/reply")
    @Operation(summary = "대댓글 작성", description = "특정 댓글에 대댓글을 생성합니다.")
    public ResponseEntity<Void> createReply(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @RequestHeader("User-Id") Long userId,
            @Valid @RequestBody CommentDto.CreateRequest request) {
        commentService.createReply(userId, commentId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/comments/{commentId}/reply/{replyId}")
    @Operation(summary = "대댓글 수정", description = "대댓글을 수정합니다.")
    public ResponseEntity<Void> updateReply(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Parameter(description = "대댓글 ID") @PathVariable Long replyId,
            @RequestHeader("User-Id") Long userId,
            @Valid @RequestBody CommentDto.UpdateRequest request) {
        commentService.updateReply(userId, commentId, replyId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}/reply/{replyId}")
    @Operation(summary = "대댓글 삭제", description = "대댓글을 삭제합니다.")
    public ResponseEntity<Void> deleteReply(
            @Parameter(description = "댓글 ID") @PathVariable Long commentId,
            @Parameter(description = "대댓글 ID") @PathVariable Long replyId,
            @RequestHeader("User-Id") Long userId) {
        commentService.deleteReply(userId, commentId, replyId);
        return ResponseEntity.noContent().build();
    }
}