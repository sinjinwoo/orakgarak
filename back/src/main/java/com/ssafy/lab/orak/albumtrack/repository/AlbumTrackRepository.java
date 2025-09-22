package com.ssafy.lab.orak.albumtrack.repository;

import com.ssafy.lab.orak.albumtrack.entity.AlbumTrack;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlbumTrackRepository extends JpaRepository<AlbumTrack, Long> {

    // 앨범의 트랙들을 순서대로 조회
    @Query("SELECT at FROM AlbumTrack at " +
           "JOIN FETCH at.record r " +
           "JOIN FETCH r.upload " +
           "WHERE at.album.id = :albumId " +
           "ORDER BY at.trackOrder ASC")
    List<AlbumTrack> findByAlbumIdOrderByTrackOrder(@Param("albumId") Long albumId);

    // 특정 앨범의 특정 순서 트랙 조회
    Optional<AlbumTrack> findByAlbumIdAndTrackOrder(Long albumId, Integer trackOrder);

    // 특정 앨범에서 특정 녹음 파일 조회
    Optional<AlbumTrack> findByAlbumIdAndRecordId(Long albumId, Long recordId);

    // 앨범의 트랙 개수 조회
    @Query("SELECT COUNT(at) FROM AlbumTrack at WHERE at.album.id = :albumId")
    Integer countByAlbumId(@Param("albumId") Long albumId);

    // 앨범의 최대 순서 번호 조회
    @Query("SELECT COALESCE(MAX(at.trackOrder), 0) FROM AlbumTrack at WHERE at.album.id = :albumId")
    Integer findMaxTrackOrderByAlbumId(@Param("albumId") Long albumId);

    // 앨범의 모든 트랙 삭제
    void deleteByAlbumId(Long albumId);

    // 특정 순서 이후의 트랙들 조회 (순서 재정렬용)
    @Query("SELECT at FROM AlbumTrack at WHERE at.album.id = :albumId AND at.trackOrder > :order ORDER BY at.trackOrder ASC")
    List<AlbumTrack> findByAlbumIdAndTrackOrderGreaterThan(@Param("albumId") Long albumId, @Param("order") Integer order);
}