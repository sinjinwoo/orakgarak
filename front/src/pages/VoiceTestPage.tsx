// 음역대 테스트 페이지 - 게임형 음성 테스트 전용 페이지
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

const VoiceTestPage: React.FC = () => {
  // ===== 상태 관리 =====

  // 사용자 알림 상태
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // 음성 테스트 관련 상태
  const [showVoiceTest, setShowVoiceTest] = useState(false); // 테스트 화면 표시 여부
  const [showVoiceTestSelection, setShowVoiceTestSelection] = useState(true);

  // ===== 이벤트 핸들러 =====

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // 음성 테스트 관련 핸들러들
  const handleNewRecording = useCallback(() => {
    console.log("🎵 VoiceTestPage: handleNewRecording 호출됨 - 음역대 테스트 시작");
    setShowVoiceTestSelection(false);
    setShowVoiceTest(true);
  }, []);

  const handleBackFromVoiceTestSelection = useCallback(() => {
    // 음역대 테스트 페이지에서는 뒤로가기를 추천 페이지로 이동
    window.location.href = "/recommendations";
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
        onGetRecommendations={() => {
          // 추천받기 버튼은 추천 페이지로 이동
          window.location.href = "/recommendations";
        }}
        onStartVoiceTest={handleNewRecording}
        onBack={handleBackFromVoiceTestSelection}
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
        </Box>

        {/* 웰컴 화면 */}
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
                음역대 테스트 게임
              </Typography>
            </Box>

            {/* 음역대 테스트 버튼 */}
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

export default VoiceTestPage;
