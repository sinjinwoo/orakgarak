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

    @Query(value = "SELECT * FROM songs WHERE MATCH(song_name, artist_name) AGAINST(:keyword IN BOOLEAN MODE) ORDER BY popularity DESC",
           nativeQuery = true)
    List<Song> searchByKeyword(@Param("keyword") String keyword);

    @Query(value = "SELECT * FROM songs WHERE MATCH(song_name, artist_name) AGAINST(:keyword IN BOOLEAN MODE) AND status = 'success' ORDER BY popularity DESC",
           countQuery = "SELECT COUNT(*) FROM songs WHERE MATCH(song_name, artist_name) AGAINST(:keyword IN BOOLEAN MODE) AND status = 'success'",
           nativeQuery = true)
    List<Song> searchByKeywordWithLimit(@Param("keyword") String keyword, org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT * FROM songs WHERE MATCH(artist_name) AGAINST(:artistName IN BOOLEAN MODE)",
           nativeQuery = true)
    List<Song> findByArtistNameContaining(@Param("artistName") String artistName);

    @Query(value = "SELECT * FROM songs WHERE MATCH(song_name) AGAINST(:songName IN BOOLEAN MODE)",
           nativeQuery = true)
    List<Song> findBySongNameContaining(@Param("songName") String songName);
}