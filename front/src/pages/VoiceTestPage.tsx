// 음역대 테스트 페이지 - 게임형 음성 테스트 전용 페이지
import React from "react";

// 음성 테스트 관련 컴포넌트들
import VoiceTestGame from "../components/voiceTest/VoiceTestGame"; // 게임형 음성 테스트

const VoiceTestPage: React.FC = () => {
  // ===== 조건부 렌더링 =====

  // 바로 게임 화면으로 진입
  return <VoiceTestGame />;
};

export default VoiceTestPage;
