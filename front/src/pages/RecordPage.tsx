/**
 * RecordPage - 마이크 상태에 따른 동적 레이아웃
 * 마이크 활성화 시: 스피커-가사-스피커
 * 마이크 비활성화 시: 노래검색-MR-예약
 */

import React, { useState, useEffect } from "react";
import SongSearchPanel from "../components/record/SongSearchPanel";
import ReservationQueue from "../components/record/ReservationQueue";
import MRLyricsCard from "../components/record/MRLyricsCard";
import RecordingControls from "../components/record/RecordingControls";
import { ReservationProvider } from "../contexts/ReservationContext";
import { useReservation } from "../hooks/useReservation";

const RecordPageContent: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.7);

  const {
    selectedSong,
    currentPlayingSong,
    isPlaying,
    playSong,
    stopSong,
    onSongFinished,
  } = useReservation();

  // 선택된 노래 변경 감지 - 새로고침 효과로 완전 초기화
  useEffect(() => {
    if (selectedSong) {
      console.log("🔄 새로고침 효과 - 새 노래 초기화:", selectedSong.title);
      console.log("🎵 선택된 노래 ID:", selectedSong.id, "타입:", typeof selectedSong.id);
      // 모든 상태 완전 초기화 (새로고침 효과)
      setCurrentTime(0);
      setDuration(180);
      setVolume(0.7); // 볼륨도 초기화
      console.log("✅ 새로고침 효과 완료 - 모든 상태 초기화됨");
    } else {
      console.log("🔄 노래 선택 해제 - 대기 상태로 초기화");
      setCurrentTime(0);
      setDuration(180);
    }
  }, [selectedSong]);

  // CSS 애니메이션 스타일 추가
  const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    
    @keyframes pulseGlow {
      0% { 
        text-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor, 0 0 80px currentColor;
        transform: perspective(500px) rotateX(15deg) scale(1);
      }
      100% { 
        text-shadow: 0 0 30px currentColor, 0 0 60px currentColor, 0 0 90px currentColor, 0 0 120px currentColor;
        transform: perspective(500px) rotateX(15deg) scale(1.05);
      }
    }
    
    @keyframes frequencyPulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    @keyframes neonScan {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(200%); }
    }
    
    @keyframes volumePulse {
      0%, 100% { 
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 0, 128, 0.5);
        transform: scaleY(1);
      }
      50% { 
        box-shadow: 0 0 25px rgba(255, 255, 255, 1), 0 0 50px rgba(255, 0, 128, 0.8);
        transform: scaleY(1.2);
      }
    }
    
    @keyframes particlePulse {
      0%, 100% { 
        transform: scale(1);
        opacity: 0.6;
      }
      50% { 
        transform: scale(1.2);
        opacity: 1;
      }
    }
    
    @keyframes corePulse {
      0% { 
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 0 20px currentColor;
      }
      100% { 
        transform: translate(-50%, -50%) scale(1.1);
        box-shadow: 0 0 40px currentColor;
      }
    }
    
    @keyframes ringRotate {
      0% { transform: translate(-50%, -50%) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    @keyframes particle3DPulse {
      0%, 100% { 
        transform: scale(1) rotateZ(0deg);
        opacity: 0.7;
      }
      50% { 
        transform: scale(1.3) rotateZ(180deg);
        opacity: 1;
      }
    }
    
    @keyframes core3DPulse {
      0% { 
        transform: translate3d(-50%, -50%, 0) scale(1) rotateX(0deg);
        box-shadow: 0 0 25px currentColor;
      }
      100% { 
        transform: translate3d(-50%, -50%, 0) scale(1.2) rotateX(360deg);
        box-shadow: 0 0 50px currentColor;
      }
    }
    
    @keyframes ring3DRotate {
      0% { 
        transform: translate3d(-50%, -50%, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
      }
      100% { 
        transform: translate3d(-50%, -50%, 0) rotateX(360deg) rotateY(360deg) rotateZ(360deg);
      }
    }
    
    /* 새로운 고품질 애니메이션 */
    @keyframes spotlightSweep {
      0% { 
        transform: rotate(0deg) scale(0.8);
        opacity: 0.3;
      }
      25% { 
        transform: rotate(90deg) scale(1.1);
        opacity: 0.6;
      }
      50% { 
        transform: rotate(180deg) scale(1.3);
        opacity: 0.8;
      }
      75% { 
        transform: rotate(270deg) scale(1.1);
        opacity: 0.6;
      }
      100% { 
        transform: rotate(360deg) scale(0.8);
        opacity: 0.3;
      }
    }
    
    @keyframes sparkleFloat {
      0%, 100% { 
        transform: translateY(0px) scale(0.8);
        opacity: 0.4;
        filter: blur(0px);
      }
      25% { 
        transform: translateY(-15px) scale(1.2);
        opacity: 0.8;
        filter: blur(0.5px);
      }
      50% { 
        transform: translateY(-25px) scale(1.4);
        opacity: 1;
        filter: blur(0px);
      }
      75% { 
        transform: translateY(-15px) scale(1.2);
        opacity: 0.8;
        filter: blur(0.5px);
      }
    }
    
    @keyframes neonPulse {
      0% { 
        box-shadow: 
          0 0 20px rgba(236,72,153,0.3),
          0 0 40px rgba(6,182,212,0.3),
          0 0 60px rgba(236,72,153,0.2);
        filter: brightness(1);
      }
      50% { 
        box-shadow: 
          0 0 30px rgba(236,72,153,0.5),
          0 0 60px rgba(6,182,212,0.5),
          0 0 90px rgba(236,72,153,0.4),
          0 0 120px rgba(6,182,212,0.3);
        filter: brightness(1.2);
      }
      100% { 
        box-shadow: 
          0 0 20px rgba(236,72,153,0.3),
          0 0 40px rgba(6,182,212,0.3),
          0 0 60px rgba(236,72,153,0.2);
        filter: brightness(1);
      }
    }
    
    @keyframes shimmerSweep {
      0% { 
        transform: translateX(-100%) skewX(-15deg);
        opacity: 0;
      }
      10% { 
        opacity: 1;
      }
      90% { 
        opacity: 1;
      }
      100% { 
        transform: translateX(200%) skewX(-15deg);
        opacity: 0;
      }
    }
    
    @keyframes particleOrbit {
      0% { 
        transform: translate(-50%, -50%) rotate(0deg) translateX(100px) rotate(0deg) scale(0.5);
        opacity: 0.3;
      }
      25% { 
        transform: translate(-50%, -50%) rotate(90deg) translateX(100px) rotate(-90deg) scale(1);
        opacity: 0.8;
      }
      50% { 
        transform: translate(-50%, -50%) rotate(180deg) translateX(100px) rotate(-180deg) scale(1.2);
        opacity: 1;
      }
      75% { 
        transform: translate(-50%, -50%) rotate(270deg) translateX(100px) rotate(-270deg) scale(1);
        opacity: 0.8;
      }
      100% { 
        transform: translate(-50%, -50%) rotate(360deg) translateX(100px) rotate(-360deg) scale(0.5);
        opacity: 0.3;
      }
    }
    
    @keyframes holographicGlow {
      0%, 100% { 
        text-shadow: 
          0 0 5px rgba(236,72,153,0.8),
          0 0 10px rgba(236,72,153,0.6),
          0 0 15px rgba(236,72,153,0.4),
          0 0 20px rgba(6,182,212,0.6),
          0 0 35px rgba(6,182,212,0.4),
          0 0 40px rgba(6,182,212,0.2);
      }
      50% { 
        text-shadow: 
          0 0 10px rgba(236,72,153,1),
          0 0 20px rgba(236,72,153,0.8),
          0 0 30px rgba(236,72,153,0.6),
          0 0 40px rgba(6,182,212,0.8),
          0 0 60px rgba(6,182,212,0.6),
          0 0 80px rgba(6,182,212,0.4);
      }
    }
    
    @keyframes dataStream {
      0% { 
        transform: translateY(-100%);
        opacity: 0;
      }
      10% { 
        opacity: 1;
      }
      90% { 
        opacity: 1;
      }
      100% { 
        transform: translateY(100vh);
        opacity: 0;
      }
    }
  `;

  // 녹음 상태 변경 핸들러
  const handleRecordingChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // YouTube 플레이어에서 실제 시간 업데이트 받기 (MRLyricsCard에서 처리)
  // 내부 타이머는 제거하고 YouTube 플레이어의 실제 시간을 사용

  // 재생/정지 버튼 핸들러 - 명확한 토글 방식
  const handlePlayPause = () => {
    if (!selectedSong) {
      console.log("❌ 선택된 노래가 없습니다");
      return;
    }

    console.log("🎮 재생/정지 버튼 클릭:", {
      selectedSong: selectedSong.title,
      currentPlayingSong: currentPlayingSong?.title,
      isPlaying,
    });

    // 재생 중이면 완전 정지 (새로고침 효과), 정지 중이면 재생 시작
    if (isPlaying) {
      console.log("⏹️ 재생 중 → 완전 초기화 (새로고침 효과)");
      stopSong(); // 완전 정지 (곡 해제)
      setCurrentTime(0); // 시간 초기화
      setDuration(180); // 기본 시간으로 초기화
    } else {
      console.log("▶️ 정지 상태 → 재생 시작");
      setCurrentTime(0); // 항상 0초부터 시작
      playSong();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

  // MRLyricsCard로부터 실제 YouTube 시간 업데이트 수신
  const handleTimeUpdateRequest = (seconds: number, dur?: number) => {
    const newTime = Math.max(0, Math.floor(seconds));
    const newDuration = dur && dur > 0 ? Math.floor(dur) : 180;

    console.log("⏰ 시간 업데이트:", {
      currentTime: newTime,
      duration: newDuration,
      progress: `${Math.floor(newTime / 60)}:${(newTime % 60)
        .toString()
        .padStart(2, "0")} / ${Math.floor(newDuration / 60)}:${(
        newDuration % 60
      )
        .toString()
        .padStart(2, "0")}`,
    });

    setCurrentTime(newTime);
    setDuration(newDuration);
  };

  // 사용자가 시크 요청했을 때(유튜브/로컬 공통)
  const handleSeekRequest = (seconds: number) => {
    setCurrentTime(Math.max(0, Math.floor(seconds)));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(1500px 800px at 15% 85%, rgba(0, 150, 255, 0.04), transparent 60%),
          radial-gradient(1200px 600px at 85% 15%, rgba(150, 0, 255, 0.04), transparent 60%),
          radial-gradient(1000px 500px at 50% 50%, rgba(0, 255, 150, 0.03), transparent 70%),
          linear-gradient(135deg, #0a0f1a 0%, #1a1f2e 25%, #2a2f3e 50%, #1a1f2e 75%, #0a0f1a 100%)
        `,
        padding: "24px",
        paddingTop: "120px",
        position: "relative",
        overflow: "auto",
      }}
    >
      {/* 홀로그램 애니메이션 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />

      {/* 미묘한 홀로그램 그리드 배경 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0, 150, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 150, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          animation: "gridPulse 20s ease-in-out infinite",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* 메인 컨테이너 */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          opacity: isInitialized ? 1 : 0,
          transform: isInitialized ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s ease",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* 홀로그램 프로젝션 시스템 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isRecording ? "0.8fr 1.4fr 0.8fr" : "1fr 1fr 1fr",
            gap: isRecording ? "24px" : "28px",
            alignItems: "start",
            justifyContent: "center",
            transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "visible",
            minHeight: "600px",
          }}
        >
          {/* 왼쪽 홀로그램 패널: 검색 시스템 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              transform: isRecording 
                ? "scale(0.85) translateX(-20px)" 
                : "scale(1) translateX(0px)",
              opacity: isRecording ? 0.6 : 1,
              transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "500px",
                background: `
                  linear-gradient(135deg, rgba(0, 180, 255, 0.08) 0%, rgba(0, 0, 0, 0.9) 100%),
                  linear-gradient(45deg, rgba(0, 180, 255, 0.05) 0%, transparent 50%)
                `,
                border: "1px solid rgba(0, 180, 255, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 0 0 1px rgba(0, 180, 255, 0.2),
                  inset 0 1px 0 rgba(0, 180, 255, 0.1)
                `,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* 미묘한 홀로그램 스캔 라인 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(0, 180, 255, 0.15) 50%, transparent 100%)",
                  animation: "hologramScan 4s linear infinite",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              
              {/* 정교한 코너 프레임 */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(0, 180, 255, 0.6)",
                  borderRight: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 8px rgba(0, 180, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(0, 180, 255, 0.6)",
                  borderLeft: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 8px rgba(0, 180, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(0, 180, 255, 0.6)",
                  borderRight: "none",
                  borderTop: "none",
                  boxShadow: "0 0 8px rgba(0, 180, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(0, 180, 255, 0.6)",
                  borderLeft: "none",
                  borderTop: "none",
                  boxShadow: "0 0 8px rgba(0, 180, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              
              {/* 시스템 상태 표시 */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "rgba(0, 180, 255, 0.9)",
                  fontSize: "9px",
                  fontFamily: "'SF Mono', monospace",
                  letterSpacing: "0.8px",
                  fontWeight: "500",
                  zIndex: 2,
                }}
              >
              </div>
              
              <div style={{ position: "relative", zIndex: 3, flex: 1, marginTop: "8px" }}>
                <SongSearchPanel />
              </div>
              
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  color: "rgba(0, 180, 255, 0.7)",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', monospace",
                  fontWeight: "400",
                  letterSpacing: "0.4px",
                  position: "relative",
                  zIndex: 3,
                }}
              >
              </div>
            </div>
          </div>

          {/* 중앙 홀로그램 프로젝션: 메인 시스템 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              transform: isRecording 
                ? "scale(1.05)" 
                : "scale(1)",
              transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {/* 메인 홀로그램 프로젝션 카드 */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: isRecording ? "520px" : "500px",
                background: `
                  linear-gradient(135deg, rgba(0, 180, 255, 0.12) 0%, rgba(0, 0, 0, 0.95) 100%),
                  linear-gradient(45deg, rgba(0, 180, 255, 0.08) 0%, transparent 50%),
                  linear-gradient(-45deg, rgba(150, 0, 255, 0.06) 0%, transparent 50%)
                `,
                border: isRecording 
                  ? "2px solid rgba(0, 180, 255, 0.6)" 
                  : "1px solid rgba(0, 180, 255, 0.4)",
                borderRadius: "20px",
                padding: "28px",
                boxShadow: isRecording
                  ? `
                    0 12px 48px rgba(0, 0, 0, 0.6),
                    0 0 0 1px rgba(0, 180, 255, 0.3),
                    inset 0 2px 0 rgba(0, 180, 255, 0.15),
                    0 0 40px rgba(0, 180, 255, 0.2)
                  `
                  : `
                    0 8px 32px rgba(0, 0, 0, 0.5),
                    0 0 0 1px rgba(0, 180, 255, 0.2),
                    inset 0 1px 0 rgba(0, 180, 255, 0.1)
                  `,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* 홀로그램 프로젝션 헤더 */}
              <div
                style={{
                  position: "absolute",
                  top: "18px",
                  left: "28px",
                  right: "28px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    color: "rgba(0, 180, 255, 0.9)",
                    fontSize: "11px",
                    fontFamily: "'SF Mono', monospace",
                    letterSpacing: "0.8px",
                    fontWeight: "600",
                  }}
                >
                </div>
                <div
                  style={{
                    color: isRecording ? "rgba(0, 255, 150, 0.9)" : "rgba(0, 180, 255, 0.7)",
                    fontSize: "9px",
                    fontFamily: "'SF Mono', monospace",
                    letterSpacing: "0.6px",
                    fontWeight: "500",
                  }}
                >
                </div>
              </div>

              {/* 미묘한 홀로그램 스캔 라인 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: isRecording
                    ? "linear-gradient(90deg, transparent 0%, rgba(0, 180, 255, 0.2) 50%, transparent 100%)"
                    : "linear-gradient(90deg, transparent 0%, rgba(0, 180, 255, 0.1) 50%, transparent 100%)",
                  animation: "hologramScan 3s linear infinite",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              
              {/* 정교한 코너 프레임 */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  width: "20px",
                  height: "20px",
                  border: "1.5px solid rgba(0, 180, 255, 0.7)",
                  borderRight: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 10px rgba(0, 180, 255, 0.4)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  width: "20px",
                  height: "20px",
                  border: "1.5px solid rgba(0, 180, 255, 0.7)",
                  borderLeft: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 10px rgba(0, 180, 255, 0.4)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  width: "20px",
                  height: "20px",
                  border: "1.5px solid rgba(0, 180, 255, 0.7)",
                  borderRight: "none",
                  borderTop: "none",
                  boxShadow: "0 0 10px rgba(0, 180, 255, 0.4)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  right: "16px",
                  width: "20px",
                  height: "20px",
                  border: "1.5px solid rgba(0, 180, 255, 0.7)",
                  borderLeft: "none",
                  borderTop: "none",
                  boxShadow: "0 0 10px rgba(0, 180, 255, 0.4)",
                  zIndex: 2,
                }}
              />

              {/* 녹음 시 미묘한 홀로그램 효과 */}
              {isRecording && (
                <>
                  {/* 홀로그램 데이터 스트림 (더 미묘하게) */}
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: "1px",
                        height: "16px",
                        background: `linear-gradient(to bottom, transparent, rgba(0, 180, 255, 0.4), transparent)`,
                        left: `${20 + i * 10}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        animation: `holographicGlow ${3 + Math.random() * 2}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                        pointerEvents: "none",
                        zIndex: 3,
                      }}
                    />
                  ))}
                </>
              )}
              
              {/* MR/가사 컨텐츠 */}
              <div style={{ 
                position: "relative", 
                zIndex: 4,
                height: "100%",
                overflow: "hidden",
                marginTop: "32px"
              }}>
                <MRLyricsCard
                  currentSong={
                    selectedSong
                      ? {
                          id: selectedSong.id.toString(),
                          title: selectedSong.title,
                          artist: selectedSong.artist,
                          genre: selectedSong.albumName,
                          duration: selectedSong.duration.toString(),
                          youtubeId: selectedSong.youtubeId,
                          lyrics: selectedSong.lyrics,
                          albumCoverUrl: (selectedSong as unknown as { albumCoverUrl?: string; albumImageUrl?: string }).albumCoverUrl || (selectedSong as unknown as { albumCoverUrl?: string; albumImageUrl?: string }).albumImageUrl
                        }
                      : undefined
                  }
                  onPlayPause={handlePlayPause}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  volume={volume}
                  onVolumeChange={handleVolumeChange}
                  onTimeUpdateRequest={handleTimeUpdateRequest}
                  onSeekRequest={handleSeekRequest}
                  onSongFinished={onSongFinished}
                />
              </div>
              
              {/* 홀로그램 상태 표시 */}
              <div
                style={{
                  position: "absolute",
                  bottom: "18px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: isRecording ? "rgba(0, 255, 150, 0.8)" : "rgba(0, 180, 255, 0.7)",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', monospace",
                  fontWeight: "500",
                  letterSpacing: "0.4px",
                  zIndex: 5,
                }}
              >
              </div>
            </div>

            {/* 홀로그램 녹음 컨트롤 시스템 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: isRecording ? "420px" : "400px",
                transform: isRecording ? "scale(1.02)" : "scale(1)",
                transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <RecordingControls 
                onRecordingChange={handleRecordingChange} 
                selectedSongId={selectedSong?.id ? selectedSong.id : undefined}
              />
            </div>
          </div>

          {/* 오른쪽 홀로그램 패널: 큐 시스템 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              transform: isRecording 
                ? "scale(0.85) translateX(20px)" 
                : "scale(1) translateX(0px)",
              opacity: isRecording ? 0.6 : 1,
              transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "500px",
                background: `
                  linear-gradient(135deg, rgba(150, 0, 255, 0.08) 0%, rgba(0, 0, 0, 0.9) 100%),
                  linear-gradient(45deg, rgba(150, 0, 255, 0.05) 0%, transparent 50%)
                `,
                border: "1px solid rgba(150, 0, 255, 0.3)",
                borderRadius: "16px",
                padding: "24px",
                boxShadow: `
                  0 8px 32px rgba(0, 0, 0, 0.4),
                  0 0 0 1px rgba(150, 0, 255, 0.2),
                  inset 0 1px 0 rgba(150, 0, 255, 0.1)
                `,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 1.0s cubic-bezier(0.4, 0, 0.2, 1)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* 미묘한 홀로그램 스캔 라인 */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(150, 0, 255, 0.15) 50%, transparent 100%)",
                  animation: "hologramScan 4.5s linear infinite reverse",
                  pointerEvents: "none",
                  zIndex: 1,
                }}
              />
              
              {/* 정교한 코너 프레임 */}
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(150, 0, 255, 0.6)",
                  borderRight: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 8px rgba(150, 0, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(150, 0, 255, 0.6)",
                  borderLeft: "none",
                  borderBottom: "none",
                  boxShadow: "0 0 8px rgba(150, 0, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(150, 0, 255, 0.6)",
                  borderRight: "none",
                  borderTop: "none",
                  boxShadow: "0 0 8px rgba(150, 0, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "12px",
                  right: "12px",
                  width: "16px",
                  height: "16px",
                  border: "1.5px solid rgba(150, 0, 255, 0.6)",
                  borderLeft: "none",
                  borderTop: "none",
                  boxShadow: "0 0 8px rgba(150, 0, 255, 0.3)",
                  zIndex: 2,
                }}
              />
              
              {/* 시스템 상태 표시 */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "rgba(150, 0, 255, 0.9)",
                  fontSize: "9px",
                  fontFamily: "'SF Mono', monospace",
                  letterSpacing: "0.8px",
                  fontWeight: "500",
                  zIndex: 2,
                }}
              >
              </div>
              
              <div style={{ position: "relative", zIndex: 3, flex: 1, marginTop: "8px" }}>
                <ReservationQueue />
              </div>
              
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  color: "rgba(150, 0, 255, 0.7)",
                  fontSize: "10px",
                  fontFamily: "'SF Mono', monospace",
                  fontWeight: "400",
                  letterSpacing: "0.4px",
                  position: "relative",
                  zIndex: 3,
                }}
              >
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecordPage: React.FC = () => {
  return (
    <ReservationProvider>
      <RecordPageContent />
    </ReservationProvider>
  );
};

export default RecordPage;
