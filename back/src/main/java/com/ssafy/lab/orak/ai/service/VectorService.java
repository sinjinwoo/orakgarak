package com.ssafy.lab.orak.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.lab.orak.ai.dto.SaveUserVectorRequestDto;
import com.ssafy.lab.orak.ai.dto.SaveUserVectorResponseDto;
import com.ssafy.lab.orak.ai.dto.SimilarVoiceRecommendationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationResponseDto;
import com.ssafy.lab.orak.ai.dto.RecommendationSongDto;
import com.ssafy.lab.orak.song.dto.SongResponseDTO;
import com.ssafy.lab.orak.song.repository.SongRepository;
import com.ssafy.lab.orak.upload.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class VectorService {

    private final PythonAiService pythonAiService;
    private final FileUploadService fileUploadService;
    private final SongRepository songRepository;


    public Mono<VoiceRecommendationResponseDto> getSimilarVoiceRecommendations(Long userId, SimilarVoiceRecommendationRequestDto request) {
        log.info("Processing similar voice recommendation for user: {} with upload ID: {}", userId, request.uploadId());

        try {
            // Python AI 서비스 호출
            return pythonAiService.getSimilarVoiceRecommendations(userId, String.valueOf(request.uploadId()), request.topN())
                    .flatMap(pythonResponse -> {
                        log.info("Received response from Python similar voice recommendation service");

                        // Python 응답에서 songId 목록 추출
                        List<Long> songIds = extractSongIds(pythonResponse);
                        log.info("Extracted {} song IDs from Python response", songIds.size());

                        // DB에서 Song 엔티티들 조회
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

                        // 유사 사용자 정보 추출
                        int similarUsersFound = extractSimilarUsersCount(pythonResponse);

                        // SongResponseDTO를 RecommendationSongDto로 변환
                        List<RecommendationSongDto> recommendationDtos = songDtos.stream()
                                .map(songDto -> RecommendationSongDto.builder()
                                        .id(songDto.getId())
                                        .songId(songDto.getSongId())
                                        .songName(songDto.getSongName())
                                        .artistName(songDto.getArtistName())
                                        .albumCoverUrl(songDto.getAlbumCoverUrl())
                                        .build())
                                .collect(Collectors.toList());

                        // 응답 생성
                        String status = recommendationDtos.isEmpty() ? "no_results" : "success";
                        String message = recommendationDtos.isEmpty() ?
                                "유사한 목소리의 사용자를 찾을 수 없습니다." :
                                String.format("%d명의 유사한 사용자를 기반으로 %d개의 곡을 추천합니다.", similarUsersFound, recommendationDtos.size());

                        VoiceRecommendationResponseDto response = VoiceRecommendationResponseDto.builder()
                                .status(status)
                                .message(message)
                                .recommendations(recommendationDtos)
                                .build();

                        log.info("Similar voice recommendation completed for user: {} - {} songs recommended", userId, songDtos.size());
                        return Mono.just(response);
                    });

        } catch (Exception e) {
            log.error("Error processing similar voice recommendation for user: {}", userId, e);
            return Mono.error(new RuntimeException("유사 목소리 추천 처리 중 오류가 발생했습니다: " + e.getMessage(), e));
        }
    }

    private List<Long> extractSongIds(JsonNode pythonResponse) {
        List<Long> songIds = new ArrayList<>();

        try {
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

    private int extractSimilarUsersCount(JsonNode pythonResponse) {
        try {
            if (pythonResponse.has("similar_users_found")) {
                return pythonResponse.get("similar_users_found").asInt();
            }
        } catch (Exception e) {
            log.error("Error extracting similar users count from Python response: {}", e.getMessage(), e);
        }
        return 0;
    }

    @Async
    public void processRecordVectorAsync(Long userId, Long uploadId, Long songId) {
        log.info("Record 저장 후 비동기 벡터 처리 시작: userId={}, uploadId={}, songId={}", userId, uploadId, songId);

        try {
            // Upload ID로 파일 URL 조회
            var upload = fileUploadService.getUpload(uploadId);
            String fileUrl = fileUploadService.getFileUrl(upload);

            log.info("Record 벡터 처리를 위한 파일 URL 조회 완료: uploadId={}", uploadId);

            // Python AI 서비스 비동기 호출 (결과를 기다리지 않음)
            pythonAiService.saveUserVector(fileUrl, userId, String.valueOf(uploadId), songId)
                    .subscribe(
                        pythonResponse -> {
                            String status = pythonResponse.has("status") ? pythonResponse.get("status").asText() : "unknown";
                            String vectorId = pythonResponse.has("vector_id") ? pythonResponse.get("vector_id").asText() : null;

                            log.info("Record 벡터 처리 완료: userId={}, uploadId={}, songId={}, vectorId={}, status={}",
                                    userId, uploadId, songId, vectorId, status);
                        },
                        error -> {
                            log.error("Record 벡터 처리 실패: userId={}, uploadId={}, songId={}", userId, uploadId, songId, error);
                        }
                    );

        } catch (Exception e) {
            log.error("Record 벡터 처리 중 오류 발생: userId={}, uploadId={}, songId={}", userId, uploadId, songId, e);
        }
    }
}