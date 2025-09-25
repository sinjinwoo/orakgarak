// 추천 페이지 메인 컴포넌트 - 음성 테스트 기반 맞춤 추천 시스템
import React, { useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Alert,
  Snackbar,
} from "@mui/material";

// 음성 테스트 관련 컴포넌트들
import VoiceTestGame from "../components/voiceTest/VoiceTestGame"; // 게임형 음성 테스트
import VoiceTestSelection from "../components/voiceTest/VoiceTestSelection"; // 음성 테스트 선택
import ExistingRecordingSelection from "../components/voiceTest/ExistingRecordingSelection"; // 기존 녹음본 선택
import RecommendationResult from "../components/voiceTest/RecommendationResult"; // 추천 결과

// 타입 정의
import type { Recording } from "../types/recording";

const RecommendationsPage: React.FC = () => {
  // ===== 상태 관리 =====

  // 사용자 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // 음성 테스트 관련 상태
  const [showVoiceTest, setShowVoiceTest] = useState(false); // 테스트 화면 표시 여부

  // 페이지 상태
  const [currentStep, setCurrentStep] = useState<
    "welcome" | "test" | "recommendations"
  >("welcome");

  // 음성 테스트 선택 관련 상태
  const [showVoiceTestSelection, setShowVoiceTestSelection] = useState(false);
  const [showExistingRecordingSelection, setShowExistingRecordingSelection] =
    useState(false);

  // 추천 결과 관련 상태
  const [showRecommendationResult, setShowRecommendationResult] =
    useState(false);
  const [
    selectedRecordingForRecommendation,
    setSelectedRecordingForRecommendation,
  ] = useState<Recording | null>(null);
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null);

  // ===== 이벤트 핸들러 =====

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // 음성 테스트 관련 핸들러들
  const handleNewRecording = useCallback(() => {
    console.log("🎵 RecommendationsPage: handleNewRecording 호출됨 - 음역대 테스트 시작");
    setShowVoiceTestSelection(false);
    setCurrentStep("test");
    setShowVoiceTest(true);
  }, []);

  const handleUseExistingRecording = useCallback(() => {
    console.log("🎵 RecommendationsPage: handleUseExistingRecording 호출됨 - 추천받기 시작");
    setShowVoiceTestSelection(false);
    setShowExistingRecordingSelection(true);
  }, []);

  const handleSelectExistingRecording = useCallback(
    (recording: Recording, uploadId?: number) => {
      console.log("🎵 RecommendationsPage: 기존 녹음본 선택", {
        recording,
        uploadId,
      });
      setShowExistingRecordingSelection(false);

      if (uploadId) {
        setSelectedRecordingForRecommendation(recording);
        setSelectedUploadId(uploadId);
        setShowRecommendationResult(true);
      } else {
        console.error("uploadId가 없어서 추천을 생성할 수 없습니다.");
        // 에러 처리 - uploadId가 없을 때 기본 uploadId 사용 또는 에러 메시지
        alert("녹음본 정보가 부족해서 추천을 생성할 수 없습니다.");
      }
    },
    []
  );

  const handleBackFromVoiceTestSelection = useCallback(() => {
    setShowVoiceTestSelection(false);
  }, []);

  const handleBackFromExistingSelection = useCallback(() => {
    setShowExistingRecordingSelection(false);
    setShowVoiceTestSelection(true);
  }, []);

  const handleBackFromRecommendationResult = useCallback(() => {
    setShowRecommendationResult(false);
    setSelectedRecordingForRecommendation(null);
    setSelectedUploadId(null);
    setShowVoiceTestSelection(true);
  }, []);

  const handleGoToRecord = useCallback(() => {
    // 녹음 페이지로 이동 (라우터 사용)
    window.location.href = "/record";
  }, []);

  // ===== 조건부 렌더링 =====

  // 음성 테스트 화면
  if (showVoiceTest) {
    return <VoiceTestGame />;
  }

  // 음성 테스트 선택 화면
  if (showVoiceTestSelection) {
    return (
      <VoiceTestSelection
        onGetRecommendations={handleUseExistingRecording}
        onStartVoiceTest={handleNewRecording}
        onBack={handleBackFromVoiceTestSelection}
      />
    );
  }

  // 기존 녹음본 선택 화면
  if (showExistingRecordingSelection) {
    return (
      <ExistingRecordingSelection
        onSelectRecording={handleSelectExistingRecording}
        onBack={handleBackFromExistingSelection}
      />
    );
  }

  // 추천 결과 화면
  if (
    showRecommendationResult &&
    selectedRecordingForRecommendation &&
    selectedUploadId
  ) {
    return (
      <RecommendationResult
        recording={selectedRecordingForRecommendation}
        uploadId={selectedUploadId}
        onBack={handleBackFromRecommendationResult}
        onGoToRecord={handleGoToRecord}
      />
    );
  }

  // ===== 메인 UI =====

  return (
    <Box
      sx={{
        flex: 1,
        background:
          "radial-gradient(ellipse at center, #0a0a0a 0%, #000000 100%)",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        pt: { xs: 2, sm: 3 }, // 헤더 높이만큼 상단 패딩으로 변경
        fontFamily: "neon, monospace",
      }}
    >
      {/* 사이버펑크 배경 효과 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
          radial-gradient(circle at 20% 20%, rgba(251, 66, 212, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(66, 253, 235, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(251, 66, 212, 0.05) 0%, transparent 70%)
        `,
          animation: "cyberGlow 4s ease-in-out infinite alternate",
          "@keyframes cyberGlow": {
            "0%": { opacity: 0.3 },
            "100%": { opacity: 0.7 },
          },
          zIndex: 0,
        }}
      />

      {/* 그리드 패턴 */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
          linear-gradient(rgba(251, 66, 212, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(66, 253, 235, 0.03) 1px, transparent 1px)
        `,
          backgroundSize: "50px 50px",
          animation: "gridMove 20s linear infinite",
          "@keyframes gridMove": {
            "0%": { transform: "translate(0, 0)" },
            "100%": { transform: "translate(50px, 50px)" },
          },
          zIndex: 0,
        }}
      />

      <Container maxWidth="xl" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        {/* 상단 네비게이션 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: "bold",
              color: "#FB42D4",
              fontSize: { xs: "2rem", md: "2.5rem" },
              textShadow: "0 0 20px #F40AD5",
              fontFamily: "neon, monospace",
              animation: "cyber 2s ease-in-out infinite alternate",
              "@keyframes cyber": {
                "0%": { textShadow: "0 0 20px #F40AD5" },
                "100%": { textShadow: "0 0 40px #F40AD5, 0 0 60px #F40AD5" },
              },
            }}
          >
            🎵 NEON RECOMMENDATIONS
          </Typography>
        </Box>

        {/* 웰컴 화면 */}
        {currentStep === "welcome" && (
          <Box
            sx={{
              position: "relative",
              minHeight: "80vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* 사이버펑크 배경 애니메이션 */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                radial-gradient(circle at 20% 20%, rgba(251, 66, 212, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(66, 253, 235, 0.2) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(251, 66, 212, 0.1) 0%, transparent 70%)
              `,
                animation: "cyberPulse 4s ease-in-out infinite alternate",
                "@keyframes cyberPulse": {
                  "0%": { opacity: 0.3 },
                  "100%": { opacity: 0.7 },
                },
              }}
            />

            {/* 메인 콘텐츠 */}
            <Box
              sx={{
                position: "relative",
                zIndex: 2,
                textAlign: "center",
                maxWidth: "600px",
                px: 3,
              }}
            >
              {/* 타이틀 */}
              <Box sx={{ mb: 4 }}>

                <Typography
                  variant="h4"
                  sx={{
                    color: "#42FDEB",
                    fontSize: { xs: "1.2rem", md: "1.5rem" },
                    fontWeight: 300,
                    letterSpacing: "0.5px",
                    lineHeight: 1.6,
                    textShadow: "0 0 10px #23F6EF",
                    fontFamily: "neon, monospace",
                  }}
                >
                  당신만의 맞춤 추천을 받아보세요
                </Typography>
              </Box>

              {/* 두 개의 메인 버튼 */}
              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  justifyContent: "center",
                  maxWidth: "800px",
                  mx: "auto",
                  flexWrap: "wrap",
                }}
              >
                {/* 추천받기 버튼 */}
                <Box
                  onClick={handleUseExistingRecording}
                  sx={{
                    background:
                      "linear-gradient(135deg, rgba(251, 66, 212, 0.1) 0%, rgba(66, 253, 235, 0.1) 100%)",
                    border: "2px solid rgba(251, 66, 212, 0.3)",
                    borderRadius: "25px",
                    p: 4,
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "neon, monospace",
                    minWidth: "300px",
                    "&:hover": {
                      transform: "translateY(-10px) scale(1.02)",
                      border: "2px solid rgba(251, 66, 212, 0.6)",
                      boxShadow: "0 25px 50px rgba(251, 66, 212, 0.3)",
                      "& .card-icon": {
                        transform: "scale(1.2) rotate(10deg)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(135deg, rgba(251, 66, 212, 0.05) 0%, rgba(66, 253, 235, 0.05) 50%, transparent 100%)",
                      zIndex: 1,
                    }}
                  />

                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 2,
                      textAlign: "center",
                    }}
                  >
                    <Box
                      className="card-icon"
                      sx={{
                        fontSize: "5rem",
                        mb: 3,
                        transition: "all 0.3s ease",
                      }}
                    >
                      🎵
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        color: "#FB42D4",
                        fontWeight: "bold",
                        mb: 2,
                        textShadow: "0 0 15px #F40AD5",
                        fontFamily: "neon, monospace",
                      }}
                    >
                      추천받기
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#42FDEB",
                        lineHeight: 1.6,
                        textShadow: "0 0 10px #23F6EF",
                        fontFamily: "neon, monospace",
                        mb: 2,
                      }}
                    >
                      기존 녹음본을 사용하여
                      <br />
                      맞춤형 노래 추천을 받습니다
                    </Typography>
                  </Box>
                </Box>

                {/* 음역대 테스트 버튼 */}
                <Box
                  onClick={handleNewRecording}
                  sx={{
                    background:
                      "linear-gradient(135deg, rgba(66, 253, 235, 0.1) 0%, rgba(251, 66, 212, 0.1) 100%)",
                    border: "2px solid rgba(66, 253, 235, 0.3)",
                    borderRadius: "25px",
                    p: 4,
                    cursor: "pointer",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    overflow: "hidden",
                    fontFamily: "neon, monospace",
                    minWidth: "300px",
                    "&:hover": {
                      transform: "translateY(-10px) scale(1.02)",
                      border: "2px solid rgba(66, 253, 235, 0.6)",
                      boxShadow: "0 25px 50px rgba(66, 253, 235, 0.3)",
                      "& .card-icon": {
                        transform: "scale(1.2) rotate(-10deg)",
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(135deg, rgba(66, 253, 235, 0.05) 0%, rgba(251, 66, 212, 0.05) 50%, transparent 100%)",
                      zIndex: 1,
                    }}
                  />

                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 2,
                      textAlign: "center",
                    }}
                  >
                    <Box
                      className="card-icon"
                      sx={{
                        fontSize: "5rem",
                        mb: 3,
                        transition: "all 0.3s ease",
                      }}
                    >
                      🎤
                    </Box>
                    <Typography
                      variant="h4"
                      sx={{
                        color: "#42FDEB",
                        fontWeight: "bold",
                        mb: 2,
                        textShadow: "0 0 15px #23F6EF",
                        fontFamily: "neon, monospace",
                      }}
                    >
                      음역대 테스트
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "#FB42D4",
                        lineHeight: 1.6,
                        textShadow: "0 0 10px #F40AD5",
                        fontFamily: "neon, monospace",
                        mb: 2,
                      }}
                    >
                      간단한 게임을 통해
                      <br />
                      나의 음역대를 측정합니다
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* 스낵바 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{
              width: "100%",
              background: "rgba(15, 23, 42, 0.9)",
              color: "#ffffff",
              border: "1px solid rgba(66, 253, 235, 0.3)",
              "& .MuiAlert-icon": {
                color: "#42FDEB",
              },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default RecommendationsPage;