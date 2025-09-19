package com.ssafy.lab.orak.song.service;

import com.ssafy.lab.orak.song.dto.SongResponseDTO;
import com.ssafy.lab.orak.song.entity.Song;
import com.ssafy.lab.orak.song.repository.SongRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
@Transactional(readOnly = true)
public class SongService {

    private final SongRepository songRepository;

    public List<SongResponseDTO> searchSongsByTitle(String title) {
        log.info("노래 제목으로 검색: {}", title);

        List<Song> songs = songRepository.findBySongNameContaining(title);

        return songs.stream()
                .map(SongResponseDTO::from)
                .collect(Collectors.toList());
    }

    public List<SongResponseDTO> searchSongsByKeyword(String keyword) {
        log.info("키워드로 검색: {}", keyword);

        List<Song> songs = songRepository.searchByKeyword(keyword);

        return songs.stream()
                .map(SongResponseDTO::from)
                .collect(Collectors.toList());
    }

    public List<SongResponseDTO> searchSongsRealtime(String keyword, int limit) {
        log.info("실시간 검색: {} (limit: {})", keyword, limit);

        if (keyword == null || keyword.trim().length() < 2) {
            return List.of();
        }

        Pageable pageable = PageRequest.of(0, limit);
        List<Song> songs = songRepository.searchByKeywordWithLimit(keyword.trim(), pageable);

        return songs.stream()
                .map(SongResponseDTO::from)
                .collect(Collectors.toList());
    }

    public SongResponseDTO getSongById(Long songId) {
        log.info("노래 상세 조회: {}", songId);

        Song song = songRepository.findBySongId(songId)
                .orElseThrow(() -> new RuntimeException("노래를 찾을 수 없습니다. songId: " + songId));

        return SongResponseDTO.from(song);
    }
}