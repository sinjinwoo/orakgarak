package com.ssafy.lab.orak.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationRequestDto;
import com.ssafy.lab.orak.ai.dto.VoiceRecommendationResponseDto;
import com.ssafy.lab.orak.ai.dto.RecommendationSongDto;
import com.ssafy.lab.orak.ai.dto.VoiceAnalysisDto;
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
import java.util.stream.Collectors;

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
            // Python AI 서비스 호출 (벡터 DB 기반)
            return pythonAiService.getVoiceRecommendations(userId, String.valueOf(request.uploadId()), request.topN())
                    .flatMap(pythonResponse -> {
                        log.info("Received response from Python AI service");

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

                        // 음성 분석 결과 추출
                        VoiceAnalysisDto voiceAnalysis = extractVoiceAnalysis(pythonResponse);

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
                                "추천할 수 있는 곡을 찾을 수 없습니다." :
                                String.format("%d개의 곡을 추천합니다.", recommendationDtos.size());

                        VoiceRecommendationResponseDto response = VoiceRecommendationResponseDto.builder()
                                .status(status)
                                .message(message)
                                .recommendations(recommendationDtos)
                                .voiceAnalysis(voiceAnalysis)
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

    private VoiceAnalysisDto extractVoiceAnalysis(JsonNode pythonResponse) {
        try {
            // Python 응답에서 voice_analysis 필드 추출
            if (pythonResponse.has("voice_analysis")) {
                JsonNode voiceAnalysisNode = pythonResponse.get("voice_analysis");

                String summary = voiceAnalysisNode.has("summary") ? voiceAnalysisNode.get("summary").asText() : null;

                List<String> desc = new ArrayList<>();
                if (voiceAnalysisNode.has("desc") && voiceAnalysisNode.get("desc").isArray()) {
                    for (JsonNode descNode : voiceAnalysisNode.get("desc")) {
                        desc.add(descNode.asText());
                    }
                }

                List<String> allowedGenres = new ArrayList<>();
                if (voiceAnalysisNode.has("allowedGenres") && voiceAnalysisNode.get("allowedGenres").isArray()) {
                    for (JsonNode genreNode : voiceAnalysisNode.get("allowedGenres")) {
                        allowedGenres.add(genreNode.asText());
                    }
                }

                VoiceAnalysisDto voiceAnalysis = VoiceAnalysisDto.builder()
                        .summary(summary)
                        .desc(desc)
                        .allowedGenres(allowedGenres)
                        .build();

                log.info("Successfully extracted voice analysis with {} genres", allowedGenres.size());
                return voiceAnalysis;
            }

            log.warn("No voice_analysis field found in Python response");
            return null;

        } catch (Exception e) {
            log.error("Error extracting voice analysis from Python response: {}", e.getMessage(), e);
            return null;
        }
    }
}