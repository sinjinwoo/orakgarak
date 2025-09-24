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
import PitchGraph from "../components/record/PitchGraph";
import VolumeVisualizer from "../components/record/VolumeVisualizer";
import { ReservationProvider } from "../contexts/ReservationContext";
import { useReservation } from "../hooks/useReservation";
import type { Song } from "../types/song";

const RecordPageContent: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.7);

  const {
    reservationQueue,
    addToQueue,
    removeFromQueue,
    selectedSong,
    currentPlayingSong,
    isPlaying,
    selectSong,
    playSong,
    pauseSong,
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
          radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(0, 255, 0, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
        `,
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        paddingTop: "80px",
        position: "relative",
        overflow: "auto",
      }}
    >
      {/* 사이버펑크 애니메이션 스타일 */}
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />

      {/* 메인 컨테이너 */}
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          opacity: isInitialized ? 1 : 0,
          transform: isInitialized ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              background: "linear-gradient(45deg, #00ffff, #ff0080)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 10px 0",
              textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
            }}
          >
            CYBER STUDIO
          </h1>
          <p
            style={{
              color: "#00ffff",
              fontSize: "1rem",
              margin: "0",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            NEURAL RECORDING INTERFACE
          </p>
        </div>

        {/* 3컬럼 그리드 레이아웃 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "20px",
            alignItems: "start",
            overflow: "visible", // 스피커가 카드 밖으로 나올 수 있도록
          }}
        >
          {/* 왼쪽 컬럼: 마이크 상태에 따라 다른 컴포넌트 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "500px",
                perspective: "1000px",
              }}
            >
              {/* 카드 컨테이너 */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.8s ease-in-out",
                  transform: isRecording ? "rotateY(180deg)" : "rotateY(0deg)",
                  cursor: "pointer",
                }}
              >
                {/* 앞면: 노래 검색 패널 */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    background: "rgba(26, 26, 26, 0.9)",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    borderRadius: "15px",
                    padding: "20px",
                    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    zIndex: 10, // 카드 레이어 (스피커보다 낮게)
                  }}
                >
                  <SongSearchPanel />
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      color: "#00ffff",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  ></div>
                </div>

                {/* 뒷면: 피치 스피커 */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background:
                      "linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(26, 26, 26, 0.9) 50%, rgba(0, 255, 255, 0.05) 100%), radial-gradient(circle at 20% 20%, rgba(0, 255, 255, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(0, 255, 255, 0.2) 0%, transparent 50%)",
                    border: "2px solid #00ffff",
                    borderRadius: "15px",
                    padding: "20px",
                    boxShadow:
                      "0 0 30px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.1)",
                    overflow: "visible", // 스피커가 카드 밖으로 나올 수 있도록
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    zIndex: 10, // 카드 레이어 (스피커보다 낮게)
                  }}
                >
                  {/* 홀로그램 스캔 라인 */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.1) 50%, transparent 70%)",
                      animation: "hologramScan 3s linear infinite",
                      pointerEvents: "none",
                    }}
                  />
                  <PitchGraph isRecording={isRecording} />
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      color: "#00ffff",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 중앙 컬럼: MR/가사 카드 및 녹음 컨트롤 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            {/* MR/가사 카드 */}
            <div
              style={{
                background: "rgba(26, 26, 26, 0.9)",
                border: "1px solid rgba(0, 255, 0, 0.3)",
                borderRadius: "15px",
                padding: "20px",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
                height: "460px",
                overflow: "hidden",
              }}
            >
              <MRLyricsCard
                currentSong={
                  selectedSong
                    ? {
                        id: selectedSong.id.toString(),
                        title: selectedSong.title,
                        artist: selectedSong.artist,
                        genre: selectedSong.albumName,
                        duration: selectedSong.duration,
                        youtubeId: selectedSong.youtubeId,
                        lyrics: selectedSong.lyrics,
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

            {/* 녹음 컨트롤 - 사이버펑크 마이크 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
              }}
            >
              <RecordingControls 
                onRecordingChange={handleRecordingChange} 
                selectedSongId={selectedSong?.id ? parseInt(selectedSong.id) : undefined}
              />
            </div>
          </div>

          {/* 오른쪽 컬럼: 마이크 상태에 따라 다른 컴포넌트 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "500px",
                perspective: "1000px",
              }}
            >
              {/* 카드 컨테이너 */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  transformStyle: "preserve-3d",
                  transition: "transform 0.8s ease-in-out",
                  transform: isRecording ? "rotateY(180deg)" : "rotateY(0deg)",
                  cursor: "pointer",
                }}
              >
                {/* 앞면: 예약 큐 */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    background: "rgba(26, 26, 26, 0.9)",
                    border: "1px solid rgba(255, 0, 128, 0.3)",
                    borderRadius: "15px",
                    padding: "20px",
                    boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    zIndex: 10, // 카드 레이어 (스피커보다 낮게)
                  }}
                >
                  <ReservationQueue />
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      color: "#ff0080",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  ></div>
                </div>

                {/* 뒷면: 볼륨 스피커 */}
                <div
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    background:
                      "linear-gradient(135deg, rgba(255, 0, 128, 0.1) 0%, rgba(26, 26, 26, 0.9) 50%, rgba(255, 0, 128, 0.05) 100%), radial-gradient(circle at 20% 20%, rgba(255, 0, 128, 0.2) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 0, 128, 0.2) 0%, transparent 50%)",
                    border: "2px solid #ff0080",
                    borderRadius: "15px",
                    padding: "20px",
                    boxShadow:
                      "0 0 30px rgba(255, 0, 128, 0.4), inset 0 0 50px rgba(255, 0, 128, 0.1)",
                    overflow: "visible", // 스피커가 카드 밖으로 나올 수 있도록
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    zIndex: 10, // 카드 레이어 (스피커보다 낮게)
                  }}
                >
                  {/* 홀로그램 스캔 라인 */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        "linear-gradient(45deg, transparent 30%, rgba(255, 0, 128, 0.1) 50%, transparent 70%)",
                      animation: "hologramScan 3s linear infinite",
                      pointerEvents: "none",
                    }}
                  />
                  <VolumeVisualizer isRecording={isRecording} />
                  <div
                    style={{
                      textAlign: "center",
                      padding: "10px",
                      color: "#ff0080",
                      fontSize: "12px",
                      opacity: 0.7,
                    }}
                  ></div>
                </div>
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
