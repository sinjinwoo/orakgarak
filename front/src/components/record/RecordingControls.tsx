/**
 * 녹음 컨트롤 컴포넌트 - 마이크 디자인 버튼
 * - 마이크를 사용한 실시간 녹음 기능
 * - 마이크 모양의 큰 버튼으로 녹음 시작/중지
 * - 녹음 상태에 따른 UI 변화
 * - 녹음된 오디오 파일을 백엔드로 전송하는 기능
 */

import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  Modal,
  IconButton,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { Mic, PlayArrow, Pause, Save, Delete, CloudUpload } from "@mui/icons-material";
import { useProcessRecording } from "../../hooks/useRecording";
import { convertWebMToWAV } from "../../utils/fileUpload";
import AudioFileUpload from "./AudioFileUpload";

// 녹음 상태 타입 정의
type RecordingState = "idle" | "recording" | "paused" | "completed" | "error";
type RecordingMode = "microphone" | "file-upload";

interface RecordingControlsProps {
  onRecordingChange?: (isRecording: boolean) => void;
  selectedSongId?: number; // 선택된 곡 ID (옵션)
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  onRecordingChange,
  selectedSongId,
}) => {
  // selectedSongId 변경 감지 로그
  React.useEffect(() => {
    console.log("🎵 RecordingControls - selectedSongId 변경:", selectedSongId);
  }, [selectedSongId]);
  // 모드 선택 상태
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("microphone");
  
  // 녹음 관련 상태 관리
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [playableAudioBlob, setPlayableAudioBlob] = useState<Blob | null>(null); // 재생용 오디오
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showSnackbar, setShowSnackbar] = useState(false);

  // 모달 관련 상태 관리
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [recordingTitle, setRecordingTitle] = useState(""); // 녹음 제목
  const [isConverting, setIsConverting] = useState(false); // WAV 변환 중 상태

  // 녹음 관련 refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isCancelledRef = useRef<boolean>(false); // ref로 취소 상태 추적

  // 녹음 처리 훅
  const processRecording = useProcessRecording();
  


  // 녹음 시간을 포맷팅하는 함수
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // 녹음 시작 함수
  const startRecording = useCallback(async () => {
    try {
      // 취소 상태 초기화
      isCancelledRef.current = false;

      // 마이크 권한 요청 및 미디어 스트림 가져오기
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 녹음 데이터 수집
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 녹음 완료 시 처리
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        console.log('녹음 완료:', audioBlob.size, 'bytes, type:', audioBlob.type);
        setAudioBlob(audioBlob);
        
        // 재생용 오디오 준비 (WebM이 재생 안 될 수 있으므로 WAV로 변환)
        try {
          console.log('재생용 오디오 준비 중...');
          const playableBlob = await convertWebMToWAV(audioBlob);
          console.log('재생용 WAV 생성 완료:', playableBlob.size, 'bytes');
          setPlayableAudioBlob(playableBlob);
        } catch (error) {
          console.warn('WAV 변환 실패, 원본 WebM 사용:', error);
          setPlayableAudioBlob(audioBlob);
        }
        
        setRecordingState("completed");

        // ref로 취소 상태 확인 (클로저 문제 해결)
        if (!isCancelledRef.current) {
          console.log('모달 표시');
          setShowModal(true);
        } else {
          console.log('녹음 취소됨, 모달 표시 안함');
        }

        // 스트림 정리
        stream.getTracks().forEach((track) => track.stop());
      };

      // 녹음 시작
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setRecordingState("recording");
      setRecordingTime(0);
      setErrorMessage("");

      // 녹음 상태 변경 알림
      onRecordingChange?.(true);

      // 타이머 시작
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("녹음 시작 실패:", error);
      setErrorMessage(
        "마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요."
      );
      setRecordingState("error");
      setShowSnackbar(true);
    }
  }, [onRecordingChange]);

  // 녹음 중지 함수
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop();

      // 타이머 정리
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // 녹음 상태 변경 알림
      onRecordingChange?.(false);
    }
  }, [recordingState, onRecordingChange]);

  // 리소스 정리 함수
  const cleanupResources = useCallback(() => {
    // MediaRecorder 정리
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.warn("MediaRecorder 정리 중 오류:", error);
      }
      mediaRecorderRef.current = null;
    }

    // 타이머 정리
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // 오디오 청크 정리
    audioChunksRef.current = [];
  }, []);

  // 다시 녹음 함수 (모달에서 또는 취소 후)
  const retakeRecording = useCallback(() => {
    // Web Audio 재생 정리
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsPlaying(false);

    // 리소스 정리
    cleanupResources();

    // 상태 초기화
    setRecordingState("idle");
    setRecordingTime(0);
    setAudioBlob(null);
    setPlayableAudioBlob(null);
    setErrorMessage("");
    setShowModal(false);
    setCurrentTime(0);
    setDuration(0);
    isCancelledRef.current = false;
  }, [cleanupResources]);

  // Web Audio API 시간 추적을 위한 타이머
  const playbackTimerRef = useRef<number | null>(null);
  const playbackStartTimeRef = useRef<number>(0);

  // 재생 시간 업데이트
  const startPlaybackTimer = useCallback(() => {
    console.log('재생 타이머 시작');
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
    }
    
    playbackStartTimeRef.current = Date.now() / 1000; // 현재 시간을 초 단위로 저장
    
    playbackTimerRef.current = window.setInterval(() => {
      if (audioContextRef.current && audioSourceRef.current && isPlaying) {
        const now = Date.now() / 1000;
        const elapsed = now - playbackStartTimeRef.current;
        
        console.log('재생 시간 업데이트:', {
          elapsed: elapsed.toFixed(2),
          duration: duration.toFixed(2),
          percentage: ((elapsed / duration) * 100).toFixed(1) + '%'
        });
        
        setCurrentTime(elapsed);
        
        if (elapsed >= duration) {
          console.log('재생 완료 (타이머)');
          clearInterval(playbackTimerRef.current!);
          setIsPlaying(false);
          setCurrentTime(0);
        }
      }
    }, 100);
  }, [duration, isPlaying]);

  const stopPlaybackTimer = useCallback(() => {
    console.log('재생 타이머 중지');
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);

  // Web Audio API 재생/일시정지 함수
  const toggleWebAudioPlayback = useCallback(async () => {
    try {
      if (isPlaying) {
        // 재생 중지
        if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
        }
        stopPlaybackTimer();
        setIsPlaying(false);
        setCurrentTime(0);
        console.log('Web Audio 재생 중지');
        return;
      }

      // 재생 시작
      const targetBlob = playableAudioBlob || audioBlob;
      if (!targetBlob) return;

      console.log('Web Audio API 재생 시작...');
      
      // AudioContext 생성
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // AudioContext가 suspended 상태면 resume
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // 이전 재생 중지
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      
      // Blob을 ArrayBuffer로 변환
      const arrayBuffer = await targetBlob.arrayBuffer();
      
      // AudioBuffer로 디코딩
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      console.log('🎵 AudioBuffer 디코딩 완료:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      });

      // 오디오 데이터 검증
      let hasAudioData = false;
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        let sum = 0;
        for (let i = 0; i < Math.min(1000, channelData.length); i++) {
          sum += Math.abs(channelData[i]);
        }
        const avgAmplitude = sum / Math.min(1000, channelData.length);
        console.log(`채널 ${channel} 평균 진폭:`, avgAmplitude);
        if (avgAmplitude > 0.001) hasAudioData = true;
      }

      if (!hasAudioData) {
        console.warn('⚠️ 오디오 데이터가 거의 없습니다 (무음 가능성)');
      }
      
      // AudioBufferSourceNode 생성
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // 게인 노드 추가 (볼륨 조절용)
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(2.0, audioContext.currentTime); // 볼륨 2배로 증가
      
      // 오디오 그래프 연결
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 추가 디버깅: 실제로 오디오가 재생되는지 확인
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      gainNode.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkAudioOutput = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;
        
        if (average > 0) {
          console.log('🔊 오디오 출력 감지됨:', average.toFixed(2));
        } else {
          console.log('🔇 오디오 출력 없음');
        }
      };
      
      // 1초 후 오디오 출력 확인
      setTimeout(checkAudioOutput, 1000);
      
      console.log('🔊 오디오 그래프 연결 완료:', {
        contextState: audioContext.state,
        contextSampleRate: audioContext.sampleRate,
        destinationMaxChannelCount: audioContext.destination.maxChannelCount,
        gainValue: gainNode.gain.value
      });
      
      // 재생 완료 이벤트
      source.onended = () => {
        console.log('재생 완료');
        setIsPlaying(false);
        setCurrentTime(0);
        audioSourceRef.current = null;
        stopPlaybackTimer();
      };
      
      audioSourceRef.current = source;
      
      // 재생 시작
      source.start(0);
      setIsPlaying(true);
      setDuration(audioBuffer.duration);
      
      // 타이머는 재생 시작 후에 시작
      setTimeout(() => {
        startPlaybackTimer();
      }, 50);
      
      console.log('✅ 재생 시작 명령 완료:', {
        duration: audioBuffer.duration,
        contextCurrentTime: audioContext.currentTime,
        hasAudioData
      });
      
    } catch (error) {
      console.error('재생 실패:', error);
      setErrorMessage(`재생 실패: ${error.message}`);
      setShowSnackbar(true);
      setIsPlaying(false);
    }
  }, [isPlaying, audioBlob, playableAudioBlob, startPlaybackTimer, stopPlaybackTimer]);

  // 녹음 파일을 백엔드로 전송하는 함수
  const saveRecording = useCallback(async () => {
    if (!audioBlob) return;

    // 제목이 없으면 기본 제목 사용
    const title =
      recordingTitle.trim() ||
      `녹음 ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;

    try {
      setIsConverting(true);
      
      // WebM을 WAV로 변환
      let finalAudioBlob = audioBlob;
      if (audioBlob.type.includes('webm')) {
        console.log('WebM 파일을 WAV로 변환 중...');
        finalAudioBlob = await convertWebMToWAV(audioBlob);
        console.log('WAV 변환 완료:', finalAudioBlob.type, finalAudioBlob.size);
      }
      
      setIsConverting(false);

      // Presigned URL을 통한 S3 업로드
      console.log("🎵 녹음 저장 시 songId 전달:", {
        title,
        songId: selectedSongId,
        durationSeconds: recordingTime,
        hasAudioBlob: !!finalAudioBlob
      });
      
      await processRecording.mutateAsync({
        title,
        audioBlob: finalAudioBlob,
        songId: selectedSongId,
        durationSeconds: recordingTime,
      });

      // 성공 처리
      setShowSnackbar(true);
      setErrorMessage("녹음이 성공적으로 저장되었습니다!");

      // 상태 초기화
      setRecordingState("idle");
      setRecordingTime(0);
      setAudioBlob(null);
      setPlayableAudioBlob(null);
      setRecordingTitle("");
      setShowModal(false);
    } catch (error) {
      console.error("=== 녹음 저장 실패 ===");
      console.error("Error type:", error?.constructor?.name);
      console.error("Error details:", error);
      
      // FileUploadError인 경우 추가 정보 표시
      if (error?.name === 'FileUploadError') {
        console.error("FileUploadError 상세:");
        console.error("- statusCode:", error.statusCode);
        console.error("- uploadId:", error.uploadId);
      }
      
      let userMessage = "녹음 저장에 실패했습니다.";
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('CORS')) {
          userMessage = "네트워크 오류가 발생했습니다. CORS 설정을 확인해주세요.";
        } else {
          userMessage = `녹음 저장 실패: ${error.message}`;
        }
      }
      
      setErrorMessage(userMessage);
      setShowSnackbar(true);
    } finally {
      setIsConverting(false);
    }
  }, [
    audioBlob,
    recordingTime,
    recordingTitle,
    selectedSongId,
    processRecording,
  ]);

  // 녹음 삭제 함수
  const deleteRecording = useCallback(() => {
    // 리소스 정리
    cleanupResources();

    setAudioBlob(null);
    setPlayableAudioBlob(null);
    setShowModal(false);
    setRecordingState("idle");
    setRecordingTime(0);
    isCancelledRef.current = false;
  }, [cleanupResources]);

  // 컴포넌트 언마운트 시 정리
  React.useEffect(() => {
    return () => {
      // 모든 리소스 정리
      cleanupResources();

      // AudioContext 정리
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      // 재생 타이머 정리
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }

      // Web Audio 재생 중지
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
    };
  }, [cleanupResources]);

  // 모드 변경 핸들러
  const handleModeChange = useCallback((event: React.SyntheticEvent, newMode: RecordingMode) => {
    setRecordingMode(newMode);
    // 모드 변경 시 상태 초기화
    if (newMode === "file-upload") {
      retakeRecording();
    }
  }, [retakeRecording]);

  return (
    <>
      {/* 네온 사이버펑크 애니메이션 스타일 */}
      <style>
        {`
          @keyframes neonBorderPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes cyberGridFlow {
            0% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-10px, -5px) rotate(1deg); }
            50% { transform: translate(0, -10px) rotate(0deg); }
            75% { transform: translate(5px, -5px) rotate(-1deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          
          @keyframes neonScanLine1 {
            0% { left: -120%; opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { left: 120%; opacity: 0; }
          }
          
          @keyframes neonScanLine2 {
            0% { right: -120%; opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { right: 120%; opacity: 0; }
          }
          
          @keyframes neonParticle1 {
            0%, 100% { transform: translateY(0px) scale(1); opacity: 1; }
            25% { transform: translateY(-15px) scale(1.2); opacity: 0.8; }
            50% { transform: translateY(-25px) scale(0.8); opacity: 1; }
            75% { transform: translateY(-10px) scale(1.1); opacity: 0.9; }
          }
          
          @keyframes neonParticle2 {
            0%, 100% { transform: translateX(0px) scale(1); opacity: 1; }
            25% { transform: translateX(20px) scale(0.9); opacity: 0.7; }
            50% { transform: translateX(30px) scale(1.3); opacity: 1; }
            75% { transform: translateX(10px) scale(0.8); opacity: 0.8; }
          }
          
          @keyframes neonPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(0.8); }
          }
          
          @keyframes neonTextFlow {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          
          @keyframes eqBar {
            0%, 100% { transform: scaleY(1); opacity: 0.7; }
            50% { transform: scaleY(1.5); opacity: 1; }
          }
        `}
      </style>

      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 3,
        }}
      >
        {/* 모드 선택 탭 */}
        <Paper
          elevation={0}
          sx={{
            p: 1,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(0,255,255,0.08), rgba(255,0,128,0.04))',
            border: '1px solid rgba(0,255,255,0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(0,255,255,0.2)',
          }}
        >
          <Tabs
            value={recordingMode}
            onChange={handleModeChange}
            sx={{
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                height: 3,
                borderRadius: 2,
                boxShadow: '0 0 10px rgba(0,255,255,0.5)',
              },
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                fontFamily: 'monospace',
                fontWeight: 600,
                textTransform: 'none',
                minHeight: 48,
                '&.Mui-selected': {
                  color: '#00ffff',
                  textShadow: '0 0 10px rgba(0,255,255,0.5)',
                },
                '&:hover': {
                  color: '#00ffff',
                  bgcolor: 'rgba(0,255,255,0.05)',
                },
              },
            }}
          >
            <Tab
              icon={<Mic />}
              label="마이크 녹음"
              value="microphone"
              iconPosition="start"
            />
            <Tab
              icon={<CloudUpload />}
              label="파일 업로드"
              value="file-upload"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* 모드에 따른 UI 렌더링 */}
        {recordingMode === "microphone" ? (
          <>
            {/* 시간 표시 */}
            <Typography
              variant="h3"
              sx={{
                fontFamily: "monospace",
                color: recordingState === "recording" ? "#ff0080" : "#00ffff",
                fontWeight: 700,
                textShadow: "0 0 20px rgba(0, 255, 255, 0.5)",
                fontSize: "3rem",
              }}
            >
              {formatTime(recordingTime)}
            </Typography>

            {/* 사이버펑크 마이크 버튼 */}
            <Box
              onClick={() => {
                if (recordingState === "idle") {
                  startRecording();
                } else if (recordingState === "recording") {
                  stopRecording();
                } else if (recordingState === "completed") {
                  retakeRecording();
                }
              }}
              sx={{
                position: "relative",
                width: 200,
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              {/* 마이크 이미지 */}
              <Box
                component="img"
                src="/images/mic/mico.png"
                alt="Cyberpunk Microphone"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  filter:
                    recordingState === "recording"
                      ? "hue-rotate(280deg) saturate(1.5) brightness(1.2) drop-shadow(0 0 20px #ff0080)"
                      : recordingState === "completed"
                      ? "hue-rotate(120deg) saturate(1.3) brightness(1.1) drop-shadow(0 0 15px #00ff00)"
                      : "hue-rotate(180deg) saturate(1.2) brightness(1.1) drop-shadow(0 0 15px #00ffff)",
                  transition: "all 0.3s ease",
                  animation:
                    recordingState === "recording" ? "pulse 1s infinite" : "none",
                }}
              />
            </Box>
          </>
        ) : (
          /* 파일 업로드 UI */
          <AudioFileUpload
            onUploadComplete={(recording) => {
              console.log('파일 업로드 완료:', recording);
              setShowSnackbar(true);
              setErrorMessage('파일이 성공적으로 업로드되었습니다!');
            }}
            selectedSongId={selectedSongId}
            onUploadChange={onRecordingChange}
          />
        )}

        {/* 녹음 미리보기 모달 (마이크 모드에서만) */}
        {recordingMode === "microphone" && (
          <Modal
            open={showModal && !!audioBlob}
            onClose={() => {}} // 외부 클릭으로 닫기 방지
          aria-labelledby="recording-preview-modal"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={0}
            sx={{
              width: "92%",
              maxWidth: 250,
              p: 0,
              borderRadius: "14px",
              outline: "none",
              position: "relative",
              overflow: "hidden",
              background: 'rgba(15, 18, 28, 0.7)',
              border: "2px solid transparent",
              backgroundClip: "padding-box",
              boxShadow: `
                0 18px 36px rgba(0,0,0,0.5),
                0 0 22px rgba(236,72,153,0.22),
                0 0 24px rgba(6,182,212,0.22),
                inset 0 1px 0 rgba(255,255,255,0.05)
              `,
              backdropFilter: "blur(18px)",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "14px",
                padding: "1px",
                background: 'linear-gradient(45deg, rgba(236,72,153,0.9), rgba(6,182,212,0.9))',
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
                animation: "neonBorderPulse 5s ease-in-out infinite",
              },
            }}
          >
            {/* 미니멀 글래스 배경 유지, 과한 데코 제거 */}

            {/* 네온 사이버펑크 헤더 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                px: 2,
                py: 1.25,
                borderBottom: "2px solid transparent",
                background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0))',
                backdropFilter: "blur(10px)",
                position: "relative",
              }}
            >
              <Box sx={{
                width: 22,
                height: 22,
                borderRadius: '6px',
                background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                boxShadow: '0 0 10px rgba(236,72,153,0.5), 0 0 10px rgba(6,182,212,0.45)'
              }} />
              <Typography
                id="recording-preview-modal"
                variant="h6"
                sx={{
                  m: 0,
                  fontWeight: 900,
                  letterSpacing: 0.3,
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  color: '#e5e7eb'
                }}
              >
                녹음 저장
              </Typography>
              <IconButton
                aria-label="close"
                onClick={() => setShowModal(false)}
                size="small"
                sx={{
                  ml: 'auto',
                  width: 28,
                  height: 28,
                  borderRadius: "7px",
                  color: "#94a3b8",
                  border: "1px solid rgba(148,163,184,0.35)",
                  bgcolor: "rgba(15,23,42,0.35)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    color: '#ec4899',
                    borderColor: 'rgba(236,72,153,0.6)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                <Typography sx={{ fontWeight: 900, fontSize: "16px", lineHeight: 1 }}>
                  ✕
                </Typography>
              </IconButton>
            </Box>

            {/* 본문 */}
            <Box sx={{ p: 1.5 }}>
              {/* 모던한 오디오 플레이어 */}
              {audioBlob && (
                <>
                  {/* 메인 재생 컨트롤 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                      p: 1.5,
                      borderRadius: 2,
                      background: `
                        linear-gradient(135deg, 
                          rgba(0,255,255,0.08) 0%, 
                          rgba(255,0,128,0.06) 50%,
                          rgba(0,255,170,0.08) 100%
                        )
                      `,
                      border: "1px solid rgba(0,255,255,0.18)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    {/* 재생/일시정지 버튼 */}
                    <IconButton
                      onClick={toggleWebAudioPlayback}
                      size="large"
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: "14px",
                        bgcolor: isPlaying 
                          ? "rgba(236,72,153,0.22)" 
                          : "rgba(6,182,212,0.16)",
                        color: isPlaying ? "#ec4899" : "#06b6d4",
                        border: isPlaying 
                          ? "2px solid rgba(236,72,153,0.55)" 
                          : "2px solid rgba(6,182,212,0.5)",
                        boxShadow: isPlaying 
                          ? "0 0 22px rgba(236,72,153,0.4)" 
                          : "0 0 18px rgba(6,182,212,0.28)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        "&:hover": { 
                          transform: "scale(1.08)",
                          boxShadow: isPlaying 
                            ? "0 0 26px rgba(236,72,153,0.55)" 
                            : "0 0 24px rgba(6,182,212,0.4)",
                        },
                        "&:active": {
                          transform: "scale(0.95)",
                        },
                      }}
                    >
                      {isPlaying ? <Pause sx={{ fontSize: 26 }} /> : <PlayArrow sx={{ fontSize: 26 }} />}
                    </IconButton>

                    {/* 재생 정보 및 진행바 */}
                    <Box sx={{ flex: 1 }}>
                       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Typography
                          variant="h6"
                          sx={{ 
                            color: "#06b6d4",
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            fontWeight: 700,
                            textShadow: "0 0 8px rgba(6,182,212,0.45)"
                          }}
                        >
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>
                        
                        <Typography
                          variant="body2"
                          sx={{ 
                            color: "rgba(255,255,255,0.7)",
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        >
                          {playableAudioBlob ? 'WAV' : 'WebM'} • {((playableAudioBlob || audioBlob).size / 1024 / 1024).toFixed(1)}MB
                        </Typography>
                      </Box>
                      
                      {/* 모던한 진행바 */}
                      <Box
                        sx={{
                          position: "relative",
                          height: 8,
                          borderRadius: 4,
                          bgcolor: "rgba(255,255,255,0.1)",
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                         onClick={(e) => {
                           const rect = e.currentTarget.getBoundingClientRect();
                           const clickX = e.clientX - rect.left;
                           const newTime = (clickX / rect.width) * duration;
                           
                           console.log('진행바 클릭:', {
                             clickX,
                             rectWidth: rect.width,
                             newTime: newTime.toFixed(2),
                             duration: duration.toFixed(2)
                           });
                           
                           setCurrentTime(newTime);
                           
                           // Web Audio API에서는 시간 이동이 복잡하므로 재시작
                           if (isPlaying) {
                             // 현재 재생 중이면 해당 시점부터 다시 재생
                             toggleWebAudioPlayback(); // 일시정지
                             setTimeout(() => {
                               // TODO: 특정 시점부터 재생하는 기능 구현 필요
                               // 현재는 처음부터 재생
                               toggleWebAudioPlayback();
                             }, 100);
                           }
                         }}
                      >
                        {/* 진행바 배경 */}
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            background: `
                              linear-gradient(90deg, 
                                rgba(0,255,255,0.1), 
                                rgba(255,0,128,0.1)
                              )
                            `,
                          }}
                        />
                        
                        {/* 진행바 */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            background: `linear-gradient(90deg, #06b6d4, #ec4899)`,
                            boxShadow: "0 0 12px rgba(6,182,212,0.5)",
                            transition: "width 0.1s ease",
                          }}
                        />
                        
                        {/* 재생 헤드 */}
                        <Box
                          sx={{
                            position: "absolute",
                            left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            bgcolor: "#06b6d4",
                            border: "2px solid #0b0f14",
                            boxShadow: "0 0 10px rgba(6,182,212,0.65)",
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>

                  {/* 녹음 제목 입력 */}
                  <TextField
                    fullWidth
                    label="녹음 제목"
                    placeholder="녹음 제목을 입력하세요 (선택사항)"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    variant="outlined"
                    helperText="추천 준비를 위해 제목을 입력해 주세요"
                    disabled={isConverting || processRecording.isPending}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        backgroundColor: "rgba(255,255,255,0.06)",
                        border: "2px solid rgba(236,72,153,0.55)",
                        borderRadius: 10,
                        color: "#fff",
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        letterSpacing: 0.2,
                        boxShadow: '0 0 10px rgba(236,72,153,0.25), 0 0 10px rgba(6,182,212,0.2)',
                        "&:hover": {
                          borderColor: "rgba(6,182,212,0.7)",
                        },
                        "&.Mui-focused": {
                          borderColor: "#06b6d4",
                          boxShadow: "0 0 14px rgba(6,182,212,0.35)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "rgba(255,255,255,0.02)",
                          borderColor: "rgba(255,255,255,0.1)",
                          color: "#666",
                        },
                        '& input::placeholder': {
                          color: 'rgba(255,255,255,0.8)',
                          opacity: 1
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(255,255,255,0.95)",
                        fontWeight: 900,
                        fontSize: '0.95rem',
                        "&.Mui-focused": {
                          color: "#06b6d4",
                        },
                        "&.Mui-disabled": {
                          color: "#666",
                        },
                      },
                      "& .MuiFormHelperText-root": {
                        color: 'rgba(226,232,240,0.9)',
                        fontWeight: 600,
                        marginTop: '6px'
                      }
                    }}
                  />

                  {/* 변환/저장 상태 표시 */}
                  {(isConverting || processRecording.isPending) && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 3,
                        backgroundColor: "rgba(0,255,255,0.08)",
                        border: "1px solid rgba(0,255,255,0.2)",
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={20} sx={{ color: "#00ffff" }} />
                      <Typography
                        variant="body2"
                        sx={{ color: "#00ffff", fontWeight: 600 }}
                      >
                        {isConverting 
                          ? "🔄 WebM 파일을 WAV 형식으로 변환 중입니다..." 
                          : "☁️ 업로드 중입니다..."}
                      </Typography>
                    </Paper>
                  )}

                  {/* 파일 정보 카드 */}
                  <Box
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: 3,
                      background: `
                        linear-gradient(135deg, 
                          rgba(0,255,255,0.06) 0%, 
                          rgba(255,0,128,0.04) 100%
                        )
                      `,
                      border: "1px solid rgba(0,255,255,0.15)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ 
                        color: "#00ffff",
                        mb: 2,
                        fontWeight: 600,
                        textShadow: "0 0 8px rgba(0,255,255,0.5)"
                      }}
                    >
                      📁 녹음 정보
                    </Typography>
                    
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                          재생 시간
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#00ffff", fontWeight: 600 }}>
                          {formatTime(recordingTime)}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                          파일 크기
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#00ffff", fontWeight: 600 }}>
                          {(audioBlob.size / 1024 / 1024).toFixed(1)} MB
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                          원본 형식
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#00ffff", fontWeight: 600 }}>
                          {audioBlob.type.split('/')[1].toUpperCase()}
                        </Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                          재생 형식
                        </Typography>
                        <Typography variant="body1" sx={{ color: "#00ffaa", fontWeight: 600 }}>
                          {playableAudioBlob ? 'WAV' : 'WebM'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* 모던한 액션 버튼들 */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 2,
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={
                        isConverting || processRecording.isPending ? (
                          <CircularProgress size={20} sx={{ color: "#000" }} />
                        ) : (
                          <Save />
                        )
                      }
                      onClick={saveRecording}
                      disabled={isConverting || processRecording.isPending}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        background: "linear-gradient(135deg, #00ff88, #00cc66)",
                        color: "#000",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        textTransform: "none",
                        boxShadow: "0 4px 20px rgba(0,255,136,0.3)",
                        "&:hover": {
                          background: "linear-gradient(135deg, #00ffaa, #00e695)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 25px rgba(0,255,170,0.4)",
                        },
                        "&:disabled": {
                          background: "rgba(128,128,128,0.2)",
                          color: "#666",
                        },
                      }}
                    >
                      {isConverting 
                        ? "변환 중..." 
                        : processRecording.isPending
                          ? "저장 중..." 
                          : "저장"}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<Mic />}
                      onClick={retakeRecording}
                      disabled={isConverting || processRecording.isPending}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        border: "2px solid #00ffff",
                        color: "#00ffff",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        textTransform: "none",
                        "&:hover": {
                          bgcolor: "rgba(0,255,255,0.1)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 25px rgba(0,255,255,0.3)",
                        },
                        "&:disabled": {
                          border: "2px solid #666",
                          color: "#666",
                        },
                      }}
                    >
                      다시 녹음
                    </Button>
                    
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<Delete />}
                      onClick={deleteRecording}
                      disabled={isConverting || processRecording.isPending}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        border: "2px solid #ff0080",
                        color: "#ff0080",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        textTransform: "none",
                        "&:hover": {
                          bgcolor: "rgba(255,0,128,0.1)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 6px 25px rgba(255,0,128,0.3)",
                        },
                        "&:disabled": {
                          border: "2px solid #666",
                          color: "#666",
                        },
                      }}
                    >
                      삭제
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Modal>
        )}

        {/* 오류 메시지 스낵바 */}
        <Snackbar
          open={showSnackbar}
          autoHideDuration={4000}
          onClose={() => setShowSnackbar(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setShowSnackbar(false)}
            severity={errorMessage.includes("실패") ? "error" : "success"}
            sx={{ width: "100%" }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>

        {/* CSS 애니메이션 */}
        <style>
          {`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
          @keyframes hologramScan {
            0% { transform: translateX(0); }
            100% { transform: translateX(260%); }
          }
          @keyframes eqBar {
            0%, 100% { transform: scaleY(0.6); opacity: 0.7; }
            50% { transform: scaleY(1.2); opacity: 1; }
          }
          @keyframes gridScroll {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 0 40px, 40px 0; }
          }
        `}
        </style>
      </Box>
    </>
  );
};

export default RecordingControls;
