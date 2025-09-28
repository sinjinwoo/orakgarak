package com.ssafy.lab.orak.comment.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ssafy.lab.orak.album.entity.Album;
import com.ssafy.lab.orak.auth.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Album album;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Comment parentComment;

    @Column(name = "content", nullable = false, length = 500)
    private String content;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // 기존 코드와의 호환성을 위한 메서드들
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    public Long getAlbumId() {
        return album != null ? album.getId() : null;
    }

    public Long getParentCommentId() {
        return parentComment != null ? parentComment.getId() : null;
    }

    public static class CommentBuilder {
        public CommentBuilder userId(Long userId) {
            if (userId != null) {
                this.user = User.builder().id(userId).build();
            }
            return this;
        }

        public CommentBuilder albumId(Long albumId) {
            if (albumId != null) {
                this.album = Album.builder().id(albumId).build();
            }
            return this;
        }

        public CommentBuilder parentCommentId(Long parentCommentId) {
            if (parentCommentId != null) {
                this.parentComment = Comment.builder().id(parentCommentId).build();
            }
            return this;
        }
    }

}
