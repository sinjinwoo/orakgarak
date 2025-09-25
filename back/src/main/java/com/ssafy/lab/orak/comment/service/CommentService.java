package com.ssafy.lab.orak.comment.service;


import com.ssafy.lab.orak.auth.entity.User;
import com.ssafy.lab.orak.auth.service.UserService;
import com.ssafy.lab.orak.comment.dto.CommentDto;
import com.ssafy.lab.orak.comment.entity.Comment;
import com.ssafy.lab.orak.comment.exception.CommentAccessDeniedException;
import com.ssafy.lab.orak.comment.exception.CommentNotFoundException;
import com.ssafy.lab.orak.comment.repository.CommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.stream.Collectors;

@Log4j2
@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<CommentDto.Response> getCommentsByAlbumId(Long albumId, Pageable pageable) {
        Page<Comment> comments = commentRepository.findParentCommentsByAlbumId(albumId, pageable);
        return comments.map(this::convertToResponseDto);
    }

    @Transactional(readOnly = true)
    public List<CommentDto.Response> getRepliesByCommentId(Long commentId) {
        List<Comment> replies = commentRepository.findRepliesByParentCommentId(commentId);
        return replies.stream()
                .map(this::convertToResponseDto)
                .collect(Collectors.toList());
    }

    private CommentDto.Response convertToResponseDto(Comment comment) {
        // 사용자 정보 가져오기
        User user = null;
        String userNickname = null;
        String userProfileImageUrl = null;

        try {
            user = userService.findById(comment.getUserId());
            userNickname = user.getNickname();
            userProfileImageUrl = user.getProfileImage();
        } catch (Exception e) {
            log.warn("사용자 정보를 가져올 수 없습니다. userId: {}", comment.getUserId(), e);
            userNickname = "사용자 " + comment.getUserId();
            userProfileImageUrl = null;
        }

        // 대댓글 처리
        List<CommentDto.Response> replies = null;
        if (comment.getParentCommentId() == null) {
            List<Comment> replyComments = commentRepository.findRepliesByParentCommentId(comment.getId());
            replies = replyComments.stream()
                    .map(this::convertToResponseDto)
                    .collect(Collectors.toList());
        }

        return CommentDto.Response.builder()
                .id(comment.getId())
                .userId(comment.getUserId())
                .albumId(comment.getAlbumId())
                .parentCommentId(comment.getParentCommentId())
                .content(comment.getContent())
                .createdAt(convertToLocalDateTime(comment.getCreatedAt()))
                .updatedAt(convertToLocalDateTime(comment.getUpdatedAt()))
                .userNickname(userNickname)
                .userProfileImageUrl(userProfileImageUrl)
                .replies(replies)
                .build();
    }

    private LocalDateTime convertToLocalDateTime(Long timestamp) {
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(timestamp), ZoneId.systemDefault());
    }

    public void createComment(Long userId, Long albumId, CommentDto.CreateRequest request) {
        Comment comment = Comment.builder()
                .userId(userId)
                .albumId(albumId)
                .parentCommentId(null)
                .content(request.getContent())
                .build();
        commentRepository.save(comment);
        log.info("사용자 {}가 앨범 {}에 댓글을 작성", userId, albumId);
    }

    public void updateComment(Long userId, Long commentId, CommentDto.UpdateRequest request) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException("존재하지 않는 댓글입니다."));

        if (!comment.getUserId().equals(userId)) {
            throw new CommentAccessDeniedException("댓글 수정 권한이 없습니다.");
        }

        if (comment.getIsDeleted()) {
            throw new IllegalStateException("삭제된 댓글은 수정할 수 없습니다.");
        }

        Comment updatedCommnet = Comment.builder()
                .id(comment.getId())
                .userId(comment.getUserId())
                .albumId(comment.getAlbumId())
                .parentCommentId(comment.getParentCommentId())
                .content(request.getContent())
                .isDeleted(comment.getIsDeleted())
                .createdAt(comment.getCreatedAt())
                .build();

        commentRepository.save(updatedCommnet);

        log.info("사용자 {}가 댓글 {}를 수정했습니다.", userId, commentId);
    }

    public void createReply(Long userId, Long parentCommentId, CommentDto.CreateRequest request) {
        Comment parentComment = commentRepository.findById(parentCommentId)
                .orElseThrow(()-> new CommentNotFoundException("존재하지 않는 댓글"));

        if (parentComment.getParentCommentId() != null) {
            throw new IllegalArgumentException("대댓글에는 댓글 작성 불가");
        }

        Comment reply = Comment.builder()
                .userId(userId)
                .albumId(parentComment.getAlbumId())
                .parentCommentId(parentCommentId)
                .content(request.getContent())
                .build();

        commentRepository.save(reply);

        log.info("사용자 {}가 댓글 {}에 대댓글을 작성했습니다.", userId, parentCommentId);
    }

    public void updateReply(Long userId, Long parentCommentId, Long replyId, CommentDto.UpdateRequest request) {
        Comment reply = commentRepository.findById(replyId)
                .orElseThrow(() -> new CommentNotFoundException("존재하지 않는 대댓글"));

        if (!reply.getUserId().equals(userId)) {
            throw new CommentAccessDeniedException("대댓글 수정 권한이 없습니다.");
        }
        if (!reply.getParentCommentId().equals(parentCommentId)) {
            throw new IllegalArgumentException("잘못된 대댓글 요청입니다.");
        }
        if (reply.getIsDeleted()) {
            throw new IllegalStateException("삭제된 대댓글은 수정할 수 없습니다.");
        }

        Comment updateReply = Comment.builder()
                .id(reply.getId())
                .userId(reply.getUserId())
                .albumId(reply.getAlbumId())
                .parentCommentId(reply.getParentCommentId())
                .content(request.getContent())
                .isDeleted(reply.getIsDeleted())
                .createdAt(reply.getCreatedAt())
                .build();

        commentRepository.save(updateReply);

        log.info("사용자 {}가 대댓글 {}를 수정했습니다.", userId, replyId);
    }

    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(()-> new CommentNotFoundException("존재하지 않는 댓글"));

        if (!comment.getUserId().equals(userId)) {
            throw new CommentAccessDeniedException("댓글 삭제 권한이 없습니다.");
        }

        List<Comment> replies = commentRepository.findRepliesByParentCommentId(commentId);

        if (replies.isEmpty()) {
            commentRepository.delete(comment);
            log.info("사용자 {}가 댓글 {}를 하드삭제했습니다.", userId, commentId);
        } else {
            Comment deletedComment = Comment.builder()
                    .id(comment.getId())
                    .userId(comment.getUserId())
                    .albumId(comment.getAlbumId())
                    .parentCommentId(comment.getParentCommentId())
                    .content("삭제된 댓글입니다.")
                    .isDeleted(true)
                    .createdAt(comment.getCreatedAt())
                    .build();

            commentRepository.save(deletedComment);
            log.info("사용자 {}가 댓글 {}를 소프트 삭제했습니다.", userId, commentId);
        }

    }

    public void deleteReply(Long userId, Long parentCommentId, Long replyId) {
        Comment reply = commentRepository.findById(replyId)
                .orElseThrow(()->new CommentNotFoundException("존재하지 않는 대댓글"));

        if (!reply.getUserId().equals(userId)) {
            throw new CommentAccessDeniedException("대댓글 삭제 권한이 없습니다.");
        }
        if (!reply.getParentCommentId().equals(parentCommentId)) {
            throw new IllegalArgumentException("잘못된 대댓글 요청");
        }

        commentRepository.delete(reply);

        log.info("사용자 {}가 대댓글 {}를 삭제했습니다.", userId, replyId);
    }
}

