package com.ssafy.lab.orak.comment.repository;

import com.ssafy.lab.orak.comment.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

//    앨범의 댓글 목록 조회
    @Query("SELECT c FROM Comment c WHERE c.albumId = :albumId AND c.parentCommentId IS NULL AND c.isDeleted = false  ORDER BY c.createdAt DESC")
    Page<Comment> findParentCommentsByAlbumId(Long albumId, Pageable pageable);

//    특정 댓글의 대댓글 목록 조회
    @Query("SELECT c FROM Comment c WHERE c.parentCommentId = :parentCommentId AND c.isDeleted = false ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentCommentId(@Param("parentCommentId") Long parentCommentId);


}
