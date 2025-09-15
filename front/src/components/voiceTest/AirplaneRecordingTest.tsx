import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Square, Upload, ArrowLeft } from 'lucide-react';

interface AirplaneRecordingTestProps {
  onComplete: (audioBlob: Blob) => void;
  onBack: () => void;
}

const AirplaneRecordingTest: React.FC<AirplaneRecordingTestProps> = ({ onComplete, onBack }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 녹음 시간 타이머
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  // 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // 스트림 정리
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('녹음 시작 실패:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  // 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 녹음 재생
  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // 녹음 재시작
  const restartRecording = () => {
    setRecordedAudio(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  // 로컬에서 완료 처리 (백엔드 없이)
  const uploadRecording = async () => {
    if (!recordedAudio) return;

    setIsUploading(true);
    try {
      // 시뮬레이션을 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('떳다떳다 비행기 녹음 완료:', {
        audioBlob: recordedAudio,
        size: recordedAudio.size,
        type: recordedAudio.type,
        timestamp: new Date().toISOString()
      });
      
      // 완료 콜백 호출
      onComplete(recordedAudio);
    } catch (error) {
      console.error('처리 오류:', error);
      alert('처리에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 배경 애니메이션 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        animation: 'float 20s infinite linear'
      }} />

      {/* 메인 컨테이너 */}
      <div style={{
        width: '800px',
        height: '600px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '30px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: '#666'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <ArrowLeft size={24} />
        </button>

        {/* 제목 */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '10px',
          textAlign: 'center',
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ✈️ 떳다떳다 비행기
        </h1>
        
        <p style={{
          fontSize: '18px',
          color: '#666',
          marginBottom: '40px',
          textAlign: 'center',
          lineHeight: '1.5'
        }}>
          "떳다떳다 비행기"를 크고 명확하게 발음해주세요
        </p>

        {/* 녹음 상태 표시 */}
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: isRecording 
            ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' 
            : recordedAudio 
              ? 'linear-gradient(45deg, #4ecdc4, #44a08d)'
              : 'linear-gradient(45deg, #a8edea, #fed6e3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          transition: 'all 0.3s ease',
          boxShadow: isRecording 
            ? '0 0 30px rgba(255, 107, 107, 0.5)' 
            : '0 10px 30px rgba(0, 0, 0, 0.2)',
          animation: isRecording ? 'pulse 1.5s infinite' : 'none'
        }}>
          {isRecording ? (
            <Mic size={60} color="white" />
          ) : recordedAudio ? (
            <Play size={60} color="white" />
          ) : (
            <MicOff size={60} color="#999" />
          )}
        </div>

        {/* 녹음 시간 표시 */}
        {isRecording && (
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#ff6b6b',
            marginBottom: '20px',
            fontFamily: 'monospace'
          }}>
            {formatTime(recordingTime)}
          </div>
        )}

        {/* 컨트롤 버튼들 */}
        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {!recordedAudio ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                background: isRecording 
                  ? 'linear-gradient(45deg, #ff6b6b, #ee5a24)' 
                  : 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                color: 'white',
                border: 'none',
                borderRadius: '25px',
                padding: '15px 30px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
              }}
            >
              {isRecording ? <Square size={20} /> : <Mic size={20} />}
              {isRecording ? '녹음 중지' : '녹음 시작'}
            </button>
          ) : (
            <>
              <button
                onClick={playRecording}
                style={{
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
                }}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                {isPlaying ? '일시정지' : '재생'}
              </button>

              <button
                onClick={restartRecording}
                style={{
                  background: 'linear-gradient(45deg, #ffa726, #ff9800)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '15px 30px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
                }}
              >
                <Mic size={20} />
                다시 녹음
              </button>
            </>
          )}
        </div>

        {/* 완료 버튼 */}
        {recordedAudio && (
          <button
            onClick={uploadRecording}
            disabled={isUploading}
            style={{
              background: isUploading 
                ? 'linear-gradient(45deg, #bdc3c7, #95a5a6)' 
                : 'linear-gradient(45deg, #2ecc71, #27ae60)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '15px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
              opacity: isUploading ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!isUploading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.2)';
            }}
          >
            <Upload size={20} />
            {isUploading ? '처리 중...' : '완료하기'}
          </button>
        )}

        {/* 오디오 엘리먼트 */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            style={{ display: 'none' }}
          />
        )}

        {/* 안내 메시지 */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center',
          color: '#666',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {!recordedAudio && !isRecording && (
            <p>마이크 버튼을 눌러서 "떳다떳다 비행기"를 녹음해주세요</p>
          )}
          {isRecording && (
            <p>🎤 녹음 중입니다. "떳다떳다 비행기"를 크고 명확하게 발음해주세요</p>
          )}
          {recordedAudio && !isUploading && (
            <p>✅ 녹음이 완료되었습니다. 재생해서 확인한 후 완료해주세요</p>
          )}
          {isUploading && (
            <p>🔄 처리 중입니다...</p>
          )}
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes float {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-100px); }
          }
        `}
      </style>
    </div>
  );
};

export default AirplaneRecordingTest;
