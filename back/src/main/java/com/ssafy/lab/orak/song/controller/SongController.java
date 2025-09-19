package com.ssafy.lab.orak.song.controller;

import com.ssafy.lab.orak.song.dto.SongResponseDTO;
import com.ssafy.lab.orak.song.service.SongService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/songs")
@RequiredArgsConstructor
@Log4j2
public class SongController {

    private final SongService songService;

    @GetMapping("/search")
    public ResponseEntity<List<SongResponseDTO>> searchSongs(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "all") String type) {

        log.info("노래 검색 요청 - keyword: {}, type: {}", keyword, type);

        List<SongResponseDTO> songs;

        switch (type) {
            case "title":
                songs = songService.searchSongsByTitle(keyword);
                break;
            case "all":
            default:
                songs = songService.searchSongsByKeyword(keyword);
                break;
        }

        return ResponseEntity.ok(songs);
    }

    @GetMapping("/search/realtime")
    public ResponseEntity<List<SongResponseDTO>> searchSongsRealtime(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "10") int limit) {

        log.info("실시간 노래 검색 요청 - keyword: {}, limit: {}", keyword, limit);

        List<SongResponseDTO> songs = songService.searchSongsRealtime(keyword, limit);

        return ResponseEntity.ok(songs);
    }

    @GetMapping("/{songId}")
    public ResponseEntity<SongResponseDTO> getSong(@PathVariable Long songId) {
        log.info("노래 상세 조회 요청 - songId: {}", songId);

        SongResponseDTO song = songService.getSongById(songId);

        return ResponseEntity.ok(song);
    }
}