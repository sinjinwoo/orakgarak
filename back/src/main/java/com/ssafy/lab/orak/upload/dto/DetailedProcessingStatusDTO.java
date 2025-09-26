package com.ssafy.lab.orak.upload.dto;

import com.ssafy.lab.orak.upload.entity.Upload;
import com.ssafy.lab.orak.upload.enums.AudioProcessingStatus;
import com.ssafy.lab.orak.upload.enums.ProcessingStatus;
import com.ssafy.lab.orak.upload.enums.VoiceAnalysisStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DetailedProcessingStatusDTO {

    private Long uploadId;
    private String originalFilename;
    private String extension;

    // 전체 처리 상태
    private ProcessingStatus overallStatus;
    private String overallStatusDescription;

    // 세부 처리 상태
    private AudioProcessingStatus audioStatus;
    private String audioStatusDescription;
    private VoiceAnalysisStatus voiceAnalysisStatus;
    private String voiceAnalysisStatusDescription;

    // 사용자 액션 가능 여부
    private Boolean canPlay;
    private Boolean hasVoiceAnalysis;
    private String playableUrl;

    // 진행 상황
    private Double overallProgressPercentage;
    private Double audioProgressPercentage;
    private Double voiceAnalysisProgressPercentage;

    // 예상 시간
    private String estimatedTimeRemaining;
    private String audioEstimatedTime;
    private String voiceAnalysisEstimatedTime;

    // 에러 정보
    private String errorMessage;
    private String audioErrorMessage;
    private String voiceAnalysisErrorMessage;

    // 타임스탬프
    private LocalDateTime uploadedAt;
    private LocalDateTime audioConvertedAt;
    private LocalDateTime voiceAnalysisStartedAt;
    private LocalDateTime voiceAnalysisCompletedAt;
    private LocalDateTime lastUpdatedAt;

    // 파일 정보
    private String contentType;
    private Long fileSize;
    private Boolean isAudioFile;
    private Boolean isImageFile;

    // 사용자 메시지
    private String userMessage;

    public static DetailedProcessingStatusDTO from(Upload upload) {
        // 현재 상태에서 세부 상태 추출
        AudioProcessingStatus audioStatus = extractAudioStatus(upload.getProcessingStatus());
        VoiceAnalysisStatus voiceAnalysisStatus = extractVoiceAnalysisStatus(upload.getProcessingStatus());

        return DetailedProcessingStatusDTO.builder()
                .uploadId(upload.getId())
                .originalFilename(upload.getOriginalFilename())
                .extension(upload.getExtension())
                .overallStatus(upload.getProcessingStatus())
                .overallStatusDescription(upload.getProcessingStatus().getDescription())
                .audioStatus(audioStatus)
                .audioStatusDescription(audioStatus.getDescription())
                .voiceAnalysisStatus(voiceAnalysisStatus)
                .voiceAnalysisStatusDescription(voiceAnalysisStatus.getDescription())
                .canPlay(upload.getProcessingStatus().isPlayable())
                .hasVoiceAnalysis(voiceAnalysisStatus.hasResult())
                .playableUrl(upload.getProcessingStatus().isPlayable() ? generatePlayableUrl(upload) : null)
                .overallProgressPercentage(calculateOverallProgress(upload.getProcessingStatus()))
                .audioProgressPercentage(calculateAudioProgress(audioStatus))
                .voiceAnalysisProgressPercentage(calculateVoiceAnalysisProgress(voiceAnalysisStatus))
                .estimatedTimeRemaining(estimateOverallTimeRemaining(upload.getProcessingStatus()))
                .audioEstimatedTime(estimateAudioTimeRemaining(audioStatus))
                .voiceAnalysisEstimatedTime(estimateVoiceAnalysisTimeRemaining(voiceAnalysisStatus))
                .errorMessage(upload.getProcessingErrorMessage())
                .uploadedAt(upload.getCreatedAt())
                .lastUpdatedAt(upload.getUpdatedAt())
                .contentType(upload.getContentType())
                .fileSize(upload.getFileSize())
                .isAudioFile(upload.isAudioFile())
                .isImageFile(upload.isImageFile())
                .userMessage(generateUserMessage(upload.getProcessingStatus(), audioStatus, voiceAnalysisStatus))
                .build();
    }

    private static AudioProcessingStatus extractAudioStatus(ProcessingStatus status) {
        return switch (status) {
            case PENDING, UPLOADED -> AudioProcessingStatus.PENDING;
            case AUDIO_CONVERTING -> AudioProcessingStatus.CONVERTING;
            case AUDIO_CONVERTED, VOICE_ANALYSIS_PENDING, VOICE_ANALYZING,
                 VOICE_ANALYZED, COMPLETED -> AudioProcessingStatus.COMPLETED;
            case AUDIO_CONVERSION_FAILED -> AudioProcessingStatus.FAILED;
            default -> AudioProcessingStatus.PENDING;
        };
    }

    private static VoiceAnalysisStatus extractVoiceAnalysisStatus(ProcessingStatus status) {
        return switch (status) {
            case PENDING, UPLOADED, AUDIO_CONVERTING, AUDIO_CONVERTED -> VoiceAnalysisStatus.NOT_STARTED;
            case VOICE_ANALYSIS_PENDING -> VoiceAnalysisStatus.PENDING;
            case VOICE_ANALYZING -> VoiceAnalysisStatus.ANALYZING;
            case VOICE_ANALYZED, COMPLETED -> VoiceAnalysisStatus.COMPLETED;
            case VOICE_ANALYSIS_FAILED -> VoiceAnalysisStatus.FAILED;
            case AUDIO_CONVERSION_FAILED -> VoiceAnalysisStatus.SKIPPED;
            default -> VoiceAnalysisStatus.NOT_STARTED;
        };
    }

    private static Double calculateOverallProgress(ProcessingStatus status) {
        return switch (status) {
            case PENDING -> 0.0;
            case UPLOADED -> 10.0;
            case AUDIO_CONVERTING -> 40.0;
            case AUDIO_CONVERTED -> 60.0;
            case VOICE_ANALYSIS_PENDING -> 65.0;
            case VOICE_ANALYZING -> 85.0;
            case VOICE_ANALYZED, COMPLETED -> 100.0;
            case AUDIO_CONVERSION_FAILED, VOICE_ANALYSIS_FAILED, FAILED -> 0.0;
            default -> 0.0;
        };
    }

    private static Double calculateAudioProgress(AudioProcessingStatus status) {
        return switch (status) {
            case PENDING -> 0.0;
            case CONVERTING -> 50.0;
            case COMPLETED -> 100.0;
            case FAILED -> 0.0;
        };
    }

    private static Double calculateVoiceAnalysisProgress(VoiceAnalysisStatus status) {
        return switch (status) {
            case NOT_STARTED -> 0.0;
            case PENDING -> 10.0;
            case ANALYZING -> 60.0;
            case COMPLETED -> 100.0;
            case FAILED -> 0.0;
            case SKIPPED -> 0.0;
        };
    }

    private static String estimateOverallTimeRemaining(ProcessingStatus status) {
        return switch (status) {
            case PENDING -> "업로드 대기 중";
            case UPLOADED -> "처리 대기 중";
            case AUDIO_CONVERTING -> "약 1-2분";
            case AUDIO_CONVERTED -> "음성 분석 대기 중";
            case VOICE_ANALYSIS_PENDING -> "음성 분석 시작 대기";
            case VOICE_ANALYZING -> "약 2-3분";
            case VOICE_ANALYZED, COMPLETED -> "완료";
            case AUDIO_CONVERSION_FAILED, VOICE_ANALYSIS_FAILED, FAILED -> "처리 실패";
            default -> "알 수 없음";
        };
    }

    private static String estimateAudioTimeRemaining(AudioProcessingStatus status) {
        return switch (status) {
            case PENDING -> "변환 대기";
            case CONVERTING -> "약 1-2분";
            case COMPLETED -> "완료";
            case FAILED -> "변환 실패";
        };
    }

    private static String estimateVoiceAnalysisTimeRemaining(VoiceAnalysisStatus status) {
        return switch (status) {
            case NOT_STARTED -> "분석 예정";
            case PENDING -> "분석 시작 대기";
            case ANALYZING -> "약 2-3분";
            case COMPLETED -> "완료";
            case FAILED -> "분석 실패";
            case SKIPPED -> "분석 안함";
        };
    }

    private static String generateUserMessage(ProcessingStatus overallStatus,
                                            AudioProcessingStatus audioStatus,
                                            VoiceAnalysisStatus voiceAnalysisStatus) {
        if (audioStatus == AudioProcessingStatus.FAILED) {
            return "음성 변환에 실패했습니다. 다시 업로드해 주세요.";
        }

        if (audioStatus == AudioProcessingStatus.COMPLETED && voiceAnalysisStatus == VoiceAnalysisStatus.NOT_STARTED) {
            return "재생이 가능합니다! 음성 분석은 곧 시작됩니다.";
        }

        if (audioStatus == AudioProcessingStatus.COMPLETED && voiceAnalysisStatus == VoiceAnalysisStatus.ANALYZING) {
            return "재생이 가능합니다! 음성 분석이 백그라운드에서 진행 중입니다.";
        }

        if (voiceAnalysisStatus == VoiceAnalysisStatus.COMPLETED) {
            return "모든 처리가 완료되었습니다! 맞춤 추천을 확인해보세요.";
        }

        if (voiceAnalysisStatus == VoiceAnalysisStatus.FAILED) {
            return "재생은 가능하지만 음성 분석에 실패했습니다.";
        }

        return switch (overallStatus) {
            case PENDING -> "업로드를 대기하고 있습니다.";
            case UPLOADED -> "업로드가 완료되어 처리를 시작합니다.";
            case AUDIO_CONVERTING -> "음성 파일을 변환하고 있습니다.";
            case VOICE_ANALYSIS_PENDING -> "음성 분석을 준비하고 있습니다.";
            default -> "처리 중입니다.";
        };
    }

    private static String generatePlayableUrl(Upload upload) {
        // TODO: 실제 재생 가능한 URL 생성 로직 구현
        return "/api/files/" + upload.getId() + "/play";
    }
}