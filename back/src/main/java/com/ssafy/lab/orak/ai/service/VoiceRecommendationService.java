package com.ssafy.lab.orak.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationResponseDto;
import com.ssafy.lab.orak.song.dto.SongResponseDTO;
import com.ssafy.lab.orak.song.entity.Song;
import com.ssafy.lab.orak.song.repository.SongRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class VoiceRecommendationService {

    private final PythonAiService pythonAiService;
    private final FileUploadService fileUploadService;
    private final SongRepository songRepository;

    public Mono<VoiceRecommendationResponseDto> getVoiceRecommendations(Long userId, VoiceRecommendationRequestDto request) {
        log.info("Processing voice recommendation for user: {} with upload ID: {}", userId, request.uploadId());

        try {
            // 1. Upload ID로 파일 URL 조회
            var upload = fileUploadService.getUpload(request.uploadId());
            String fileUrl = fileUploadService.getFileUrl(upload);

            log.info("Retrieved file URL for upload ID {}: {}", request.uploadId(), fileUrl != null ? fileUrl.substring(0, Math.min(50, fileUrl.length())) + "..." : "null");

            // 2. Python AI 서비스 호출
            return pythonAiService.getVoiceRecommendations(fileUrl, request.topN())
                    .flatMap(pythonResponse -> {
                        log.info("Received response from Python AI service");

                        // 3. Python 응답에서 songId 목록 추출
                        List<Long> songIds = extractSongIds(pythonResponse);
                        log.info("Extracted {} song IDs from Python response", songIds.size());

                        // 4. DB에서 Song 엔티티들 조회
                        List<SongResponseDTO> songDtos = new ArrayList<>();
                        for (Long songId : songIds) {
                            songRepository.findBySongId(songId)
                                    .ifPresentOrElse(
                                            song -> {
                                                songDtos.add(SongResponseDTO.from(song));
                                                log.debug("Found song: {} - {}", song.getArtistName(), song.getSongName());
                                            },
                                            () -> log.warn("Song not found for songId: {}", songId)
                                    );
                        }

                        // 5. 응답 생성
                        String status = songDtos.isEmpty() ? "no_results" : "success";
                        String message = songDtos.isEmpty() ?
                                "추천할 수 있는 곡을 찾을 수 없습니다." :
                                String.format("%d개의 곡을 추천합니다.", songDtos.size());

                        VoiceRecommendationResponseDto response = VoiceRecommendationResponseDto.builder()
                                .status(status)
                                .message(message)
                                .recommendations(songDtos)
                                .build();

                        log.info("Voice recommendation completed for user: {} - {} songs recommended", userId, songDtos.size());
                        return Mono.just(response);
                    });

        } catch (Exception e) {
            log.error("Error processing voice recommendation for user: {}", userId, e);
            return Mono.error(new RuntimeException("음성 추천 처리 중 오류가 발생했습니다: " + e.getMessage(), e));
        }
    }

    private List<Long> extractSongIds(JsonNode pythonResponse) {
        List<Long> songIds = new ArrayList<>();

        try {
            // Python 응답 구조: {"status": "success", "recommendations": [{"song_id": 123, ...}, ...]}
            if (pythonResponse.has("recommendations") && pythonResponse.get("recommendations").isArray()) {
                for (JsonNode recommendation : pythonResponse.get("recommendations")) {
                    if (recommendation.has("song_id")) {
                        long songId = recommendation.get("song_id").asLong();
                        songIds.add(songId);
                    }
                }
            }

            log.info("Successfully extracted {} song IDs from Python response", songIds.size());

        } catch (Exception e) {
            log.error("Error extracting song IDs from Python response: {}", e.getMessage(), e);
        }

        return songIds;
    }
}