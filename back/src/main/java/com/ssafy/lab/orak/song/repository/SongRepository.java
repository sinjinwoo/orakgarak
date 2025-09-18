package com.ssafy.lab.orak.song.repository;

import com.ssafy.lab.orak.song.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SongRepository extends JpaRepository<Song, Long> {

    Optional<Song> findBySongId(Long songId);

    @Query("SELECT s FROM Song s WHERE s.lyrics IS NOT NULL AND s.lyrics != '' AND s.status = 'success'")
    List<Song> findSongsWithLyrics();

    @Query("SELECT s FROM Song s WHERE s.songName LIKE %:keyword% OR s.artistName LIKE %:keyword% ORDER BY s.popularity DESC")
    List<Song> searchByKeyword(@Param("keyword") String keyword);

    @Query("SELECT s FROM Song s WHERE (s.songName LIKE %:keyword% OR s.artistName LIKE %:keyword%) AND s.status = 'success' ORDER BY s.popularity DESC")
    List<Song> searchByKeywordWithLimit(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    List<Song> findByArtistNameContaining(String artistName);

    List<Song> findBySongNameContaining(String songName);
}