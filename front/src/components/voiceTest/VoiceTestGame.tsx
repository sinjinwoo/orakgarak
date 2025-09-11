import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Download, RotateCcw, TrendingUp, TrendingDown, Music, Star, ArrowRight } from 'lucide-react';
import { recommendedSongs } from '../../data/recommendationData';
import type { RecommendedSong } from '../../types/recommendation';

interface PipeData {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
}

interface PitchData {
  frequency: number;
  timestamp: number;
  note: string;
  octave: number;
}

interface PitchRange {
  minPitch: number;
  maxPitch: number;
  minNote: string;
  maxNote: string;
}

interface VoiceTestGameProps {
  onTestComplete?: (results: { pitchRange: PitchRange; score: number; timestamp: number }[]) => void;
  onTestCancel?: () => void;
}

const FlappyNoteGame: React.FC<VoiceTestGameProps> = ({ onTestComplete }) => {
  // 게임 상수
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;
  const CHARACTER_SIZE = 35;
  const PIPE_WIDTH = 70;
  const PIPE_GAP = 200; // 넉넉한 간격으로 설정
  const PIPE_SPEED = 2.5;

  // 게임 상태
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver' | 'recommendations'>('menu');
  const [characterY, setCharacterY] = useState(GAME_HEIGHT / 2);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchRange, setPitchRange] = useState<PitchRange>({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
  const [recommendedSongsList, setRecommendedSongsList] = useState<RecommendedSong[]>([]);
  
  // 디버그 정보
  const [debugInfo, setDebugInfo] = useState({
    micLevel: 0,
    frequency: 0,
    note: '',
    isDetecting: false
  });

  // refs
  const gameLoopRef = useRef<number | null>(null);
  const pipeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // 주파수를 음계로 변환 (원래 코드와 동일)
  const frequencyToNote = useCallback((frequency: number): { note: string; octave: number } => {
    if (frequency <= 0) return { note: '', octave: 0 };
    
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const semitone = 12 * Math.log2(frequency / A4);
    const noteNumber = Math.round(semitone) + 69;
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const note = noteNames[noteIndex < 0 ? noteIndex + 12 : noteIndex];
    
    return { note, octave };
  }, []);

  // 원래 예제 코드의 피치 감지 알고리즘 사용
  const detectFundamentalFrequency = useCallback((buffer: Float32Array, sampleRate: number): number => {
    let energy = 0;
    for (let i = 0; i < buffer.length; i++) {
      energy += Math.abs(buffer[i]);
    }
    energy = energy / buffer.length;
    
    if (energy < 0.01) return 0;
    
    let maxMagnitude = -Infinity;
    let maxIndex = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      if (buffer[i] > maxMagnitude) {
        maxMagnitude = buffer[i];
        maxIndex = i;
      }
    }
    
    const frequency = (maxIndex / buffer.length) * (sampleRate / 2);
    
    if (frequency < 80 || frequency > 800) return 0;
    if (maxMagnitude < -50) return 0;
    
    return frequency;
  }, []);

  // 피치 분석 및 캐릭터 제어 (원래 예제와 유사)
  const analyzePitch = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getFloatFrequencyData(dataArrayRef.current);
    
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += Math.abs(dataArrayRef.current[i]);
      }
    const micLevel = (sum / dataArrayRef.current.length) * 100;
    
    const frequency = detectFundamentalFrequency(dataArrayRef.current, audioContextRef.current?.sampleRate || 44100);
    
    if (frequency > 0) {
      const noteInfo = frequencyToNote(frequency);
      const pitchData: PitchData = {
        frequency,
        timestamp: Date.now(),
        note: noteInfo.note,
        octave: noteInfo.octave,
      };
      
      setCurrentPitch(pitchData);
      
      // 피치 범위 업데이트 (게임의 주요 목적)
      setPitchRange(prev => {
        const updated = { ...prev };
        if (frequency < prev.minPitch) {
          updated.minPitch = frequency;
          updated.minNote = `${noteInfo.note}${noteInfo.octave}`;
        }
        if (frequency > prev.maxPitch) {
          updated.maxPitch = frequency;
          updated.maxNote = `${noteInfo.note}${noteInfo.octave}`;
        }
        return updated;
      });
      
      // 주파수를 캐릭터 Y 위치로 매핑 (원래 코드와 동일)
      const minFreq = 150;
      const maxFreq = 400;
      const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
      const targetY = GAME_HEIGHT - (normalizedFreq * (GAME_HEIGHT - 100)) - 100;
      
      if (gameState === 'playing') {
        setCharacterY(prev => {
          const diff = targetY - prev;
          return prev + diff * 0.2; // 원래 코드와 동일한 반응속도
        });
      }
    }
    
    setDebugInfo({
      micLevel: Math.round(micLevel),
      frequency: Math.round(frequency),
      note: currentPitch ? `${currentPitch.note}${currentPitch.octave}` : '',
      isDetecting: frequency > 0
    });
  }, [gameState, currentPitch, frequencyToNote, detectFundamentalFrequency]);

  // 마이크 초기화 (원래 예제와 유사하게 설정)
  const initMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Float32Array(bufferLength);
      
      microphone.connect(analyser);

      // MediaRecorder 설정
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        setRecordedBlob(blob);
        recordedChunksRef.current = [];
        setIsRecording(false);
      };
      
    } catch (err) {
      console.error('마이크 접근 실패:', err);
    }
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    setGameState('playing');
    setCharacterY(GAME_HEIGHT / 2);
    setPipes([]);
    setScore(0);
    setRecordedBlob(null);
    setPitchRange({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      recordedChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  }, []);

  // 게임 오버
  const gameOver = useCallback(() => {
    setGameState('gameOver');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    if (pipeIntervalRef.current) {
      clearInterval(pipeIntervalRef.current);
    }
  }, []);

  // 충돌 감지 (원래와 동일)
  const checkCollisions = useCallback((charY: number, pipeList: PipeData[]): boolean => {
    if (charY < 0 || charY > GAME_HEIGHT - CHARACTER_SIZE) {
      return true;
    }
    
    for (const pipe of pipeList) {
      const charLeft = 100;
      const charRight = charLeft + CHARACTER_SIZE;
      const charTop = charY;
      const charBottom = charY + CHARACTER_SIZE;
      
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;
      
      if (charRight > pipeLeft && charLeft < pipeRight) {
        if (charTop < pipe.topHeight || charBottom > GAME_HEIGHT - pipe.bottomHeight) {
          return true;
        }
      }
    }
    
    return false;
  }, []);

  // 개선된 파이프 생성 - 항상 통과 가능한 구조
  const createPipe = useCallback((): PipeData => {
    const minTopHeight = 80;
    
    // 현재 캐릭터 위치를 고려하여 통과 가능한 파이프 생성
    let targetGapCenter = characterY;
    
    // 화면 범위 내에서 조정
    const minGapCenter = PIPE_GAP / 2 + 50;
    const maxGapCenter = GAME_HEIGHT - PIPE_GAP / 2 - 50;
    targetGapCenter = Math.max(minGapCenter, Math.min(maxGapCenter, targetGapCenter));
    
    // 약간의 랜덤성 추가 (±50픽셀)
    const randomOffset = (Math.random() - 0.5) * 100;
    targetGapCenter = Math.max(minGapCenter, Math.min(maxGapCenter, targetGapCenter + randomOffset));
    
    const topHeight = targetGapCenter - PIPE_GAP / 2;
    const bottomHeight = GAME_HEIGHT - (targetGapCenter + PIPE_GAP / 2);
    
    return {
      id: Date.now() + Math.random(),
      x: GAME_WIDTH,
      topHeight: Math.max(minTopHeight, topHeight),
      bottomHeight: Math.max(50, bottomHeight),
      passed: false
    };
  }, [characterY]);

  // 게임 루프
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    setPipes(prevPipes => {
      const newPipes = prevPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      })).filter(pipe => pipe.x > -PIPE_WIDTH);
      
      newPipes.forEach(pipe => {
        if (!pipe.passed && pipe.x < 100 - CHARACTER_SIZE) {
          pipe.passed = true;
          setScore(prev => prev + 1);
        }
      });
      
      return newPipes;
    });
    
    setPipes(currentPipes => {
      if (checkCollisions(characterY, currentPipes)) {
        gameOver();
        return currentPipes;
      }
      return currentPipes;
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, characterY, checkCollisions, gameOver]);

  // 초기화
  useEffect(() => {
    initMicrophone();
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (pipeIntervalRef.current) clearInterval(pipeIntervalRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [initMicrophone]);

  // 게임 루프 시작
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      pipeIntervalRef.current = setInterval(() => {
        setPipes(prev => [...prev, createPipe()]);
      }, 2000);
    }
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (pipeIntervalRef.current) clearInterval(pipeIntervalRef.current);
    };
  }, [gameState, gameLoop, createPipe]);

  // 피치 분석 실행 (원래와 동일한 주기)
  useEffect(() => {
    const interval = setInterval(analyzePitch, 100);
    return () => clearInterval(interval);
  }, [analyzePitch]);

  // 녹음 다운로드
  const downloadRecording = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voice-range-test-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 피치 범위 표시를 위한 계산
  const getPitchRangeDisplay = () => {
    if (pitchRange.minPitch === Infinity) return { range: 0, semitones: 0 };
    const range = pitchRange.maxPitch - pitchRange.minPitch;
    const semitones = Math.round(12 * Math.log2(pitchRange.maxPitch / pitchRange.minPitch));
    return { range: Math.round(range), semitones };
  };

  // 추천 곡 생성 로직
  const generateRecommendations = useCallback(() => {
    if (pitchRange.minPitch === Infinity || pitchRange.maxPitch === 0) return;

    const userMinFreq = pitchRange.minPitch;
    const userMaxFreq = pitchRange.maxPitch;
    const userRange = userMaxFreq - userMinFreq;

    const scoredSongs = recommendedSongs.map(song => {
      // 음역대 매칭 점수 계산
      const rangeOverlap = Math.min(userMaxFreq, song.vocalRange.max) - Math.max(userMinFreq, song.vocalRange.min);
      const rangeMatch = rangeOverlap > 0 ? (rangeOverlap / Math.max(userRange, song.vocalRange.max - song.vocalRange.min)) * 100 : 0;
      
      // 난이도 보너스 (쉬운 곡일수록 높은 점수)
      const difficultyBonus = song.difficulty === 'easy' ? 20 : song.difficulty === 'medium' ? 10 : 0;
      
      // 최종 점수 계산
      const finalScore = Math.min(100, Math.round(rangeMatch + difficultyBonus + Math.random() * 10));
      
      return {
        ...song,
        matchScore: finalScore,
        reason: rangeMatch > 70 ? '당신의 음역대와 완벽하게 맞습니다!' : 
                rangeMatch > 50 ? '음역대가 잘 맞는 편입니다' : 
                '도전적인 곡이지만 연습하면 가능합니다'
      };
    });

    // 점수 순으로 정렬하고 상위 5곡만 선택
    const topRecommendations = scoredSongs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    setRecommendedSongsList(topRecommendations);
  }, [pitchRange]);

  // 추천 곡 보기 핸들러
  const handleViewRecommendations = useCallback(() => {
    generateRecommendations();
    setGameState('recommendations');
    
    // 부모 컴포넌트에 테스트 완료 알림
    if (onTestComplete) {
      onTestComplete([{
        pitchRange,
        score,
        timestamp: Date.now()
      }]);
    }
  }, [generateRecommendations, pitchRange, score, onTestComplete]);

  // 추천 화면에서 메뉴로 돌아가기
  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setPitchRange({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
    setScore(0);
    setRecordedBlob(null);
  }, []);

  // 인라인 스타일
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: '10px',
      textAlign: 'center' as const,
      textShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
    },
    subtitle: {
      fontSize: '18px',
      color: '#94a3b8',
      marginBottom: '30px',
      textAlign: 'center' as const
    },
    debugPanel: {
      background: 'rgba(15, 23, 42, 0.8)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '20px',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      backdropFilter: 'blur(10px)',
      minWidth: '400px'
    },
    debugGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
      marginBottom: '15px'
    },
    debugItem: {
      textAlign: 'center' as const,
      color: '#fff'
    },
    debugLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      marginBottom: '5px'
    },
    debugValue: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#3b82f6'
    },
    rangePanel: {
      background: 'rgba(15, 23, 42, 0.9)',
      borderRadius: '12px',
      padding: '15px',
      border: '1px solid rgba(34, 197, 94, 0.4)',
      marginTop: '15px'
    },
    gameContainer: {
      position: 'relative' as const,
      width: `${GAME_WIDTH}px`,
      height: `${GAME_HEIGHT}px`,
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      border: '3px solid #3b82f6',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)'
    },
    character: {
      position: 'absolute' as const,
      width: `${CHARACTER_SIZE}px`,
      height: `${CHARACTER_SIZE}px`,
      background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 100%)',
      borderRadius: '50%',
      border: '2px solid #fcd34d',
      boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
      transition: 'all 0.1s ease-out',
      left: '100px',
      transform: 'translate(-50%, -50%)'
    },
    pipe: {
      position: 'absolute' as const,
      background: 'linear-gradient(90deg, #059669 0%, #047857 100%)',
      border: '2px solid #10b981',
      borderRadius: '5px'
    },
    score: {
      position: 'absolute' as const,
      top: '20px',
      left: '20px',
      background: 'rgba(15, 23, 42, 0.9)',
      color: '#fff',
      padding: '10px 20px',
      borderRadius: '12px',
      fontSize: '24px',
      fontWeight: 'bold',
      border: '1px solid #3b82f6'
    },
    pitch: {
      position: 'absolute' as const,
      top: '20px',
      right: '20px',
      background: 'rgba(15, 23, 42, 0.9)',
      color: '#fff',
      padding: '10px 15px',
      borderRadius: '12px',
      textAlign: 'center' as const,
      border: '1px solid #3b82f6',
      minWidth: '80px'
    },
    modal: {
      position: 'absolute' as const,
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(5px)'
    },
    modalContent: {
      background: 'rgba(15, 23, 42, 0.95)',
      padding: '30px',
      borderRadius: '20px',
      border: '1px solid #3b82f6',
      textAlign: 'center' as const,
      color: '#fff',
      maxWidth: '400px'
    },
    button: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: '#fff',
      border: 'none',
      padding: '15px 30px',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
    }
  };

  const pitchDisplay = getPitchRangeDisplay();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🎵 VOICE RANGE TESTER</h1>
      <p style={styles.subtitle}>Discover Your Voice Range Through Gaming</p>

      {/* 통합 정보 패널 */}
      <div style={styles.debugPanel}>
        <div style={styles.debugGrid}>
          <div style={styles.debugItem}>
            <div style={styles.debugLabel}>마이크 레벨</div>
            <div style={styles.debugValue}>{debugInfo.micLevel}%</div>
        </div>
          <div style={styles.debugItem}>
            <div style={styles.debugLabel}>현재 주파수</div>
            <div style={styles.debugValue}>{debugInfo.frequency}Hz</div>
            </div>
          <div style={styles.debugItem}>
            <div style={styles.debugLabel}>현재 음표</div>
            <div style={styles.debugValue}>{debugInfo.note || '---'}</div>
            </div>
          <div style={styles.debugItem}>
            <div style={styles.debugLabel}>상태</div>
            <div style={{...styles.debugValue, color: isRecording ? '#ef4444' : '#6b7280'}}>
                {isRecording ? 'REC' : 'IDLE'}
            </div>
            </div>
          </div>
          
        {/* 음성 범위 표시 */}
        <div style={styles.rangePanel}>
          <h3 style={{margin: '0 0 15px 0', fontSize: '16px', color: '#22c55e', textAlign: 'center'}}>
            🎯 Your Voice Range
          </h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px'}}>
            <div style={{textAlign: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '5px'}}>
                <TrendingDown size={16} color="#ef4444" />
                <span style={styles.debugLabel}>최저음</span>
            </div>
              <div style={{...styles.debugValue, color: '#ef4444'}}>
                {pitchRange.minNote || '---'}
            </div>
              <div style={{fontSize: '12px', color: '#94a3b8'}}>
                {pitchRange.minPitch !== Infinity ? `${Math.round(pitchRange.minPitch)}Hz` : '---'}
          </div>
        </div>
            <div style={{textAlign: 'center'}}>
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginBottom: '5px'}}>
                <TrendingUp size={16} color="#22c55e" />
                <span style={styles.debugLabel}>최고음</span>
              </div>
              <div style={{...styles.debugValue, color: '#22c55e'}}>
                {pitchRange.maxNote || '---'}
              </div>
              <div style={{fontSize: '12px', color: '#94a3b8'}}>
                {pitchRange.maxPitch ? `${Math.round(pitchRange.maxPitch)}Hz` : '---'}
              </div>
            </div>
          </div>
          <div style={{textAlign: 'center', marginTop: '15px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px'}}>
            <div style={{fontSize: '14px', color: '#94a3b8', marginBottom: '5px'}}>음성 범위</div>
            <div style={{fontSize: '16px', fontWeight: 'bold', color: '#3b82f6'}}>
              {pitchDisplay.range}Hz ({pitchDisplay.semitones} 반음)
            </div>
          </div>
        </div>
          </div>

      {/* 게임 화면 */}
      <div style={styles.gameContainer}>
          {/* 캐릭터 */}
          {gameState !== 'menu' && (
            <div
              style={{
              ...styles.character,
              top: `${characterY}px`
            }}
          />
          )}

          {/* 파이프 */}
          {pipes.map(pipe => (
          <div key={pipe.id}>
              <div
                style={{
                ...styles.pipe,
                left: `${pipe.x}px`,
                top: '0px',
                width: `${PIPE_WIDTH}px`,
                height: `${pipe.topHeight}px`
              }}
            />
            <div
                style={{
                ...styles.pipe,
                left: `${pipe.x}px`,
                bottom: '0px',
                width: `${PIPE_WIDTH}px`,
                height: `${pipe.bottomHeight}px`
              }}
            />
            </div>
          ))}

          {/* 점수 */}
          {gameState === 'playing' && (
          <div style={styles.score}>
            Score: {score}
            </div>
          )}

        {/* 현재 피치 */}
          {currentPitch && gameState === 'playing' && (
          <div style={styles.pitch}>
            <div style={{fontSize: '14px', fontWeight: 'bold'}}>
              {currentPitch.note}{currentPitch.octave}
                </div>
            <div style={{fontSize: '10px', color: '#94a3b8'}}>
              {Math.round(currentPitch.frequency)}Hz
              </div>
            </div>
          )}

          {/* 메뉴 화면 */}
          {gameState === 'menu' && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={{fontSize: '32px', marginBottom: '20px', color: '#3b82f6'}}>
                VOICE RANGE TEST
                </h2>
              <div style={{marginBottom: '25px', lineHeight: '1.6'}}>
                <p>🎯 목표: 음성 범위 측정</p>
                <p>🔊 높은 음 → 위로 이동</p>
                <p>🔉 낮은 음 → 아래로 이동</p>
                <p>🎮 장애물을 피하며 범위 측정!</p>
                <p style={{fontSize: '14px', color: '#94a3b8', marginTop: '15px'}}>
                  다양한 높이의 소리를 내보세요
                </p>
                </div>
                <button
                style={styles.button}
                  onClick={startGame}
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1.05)';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.transform = 'scale(1)';
                }}
              >
                <Play size={20} />
                START TEST
                </button>
              </div>
            </div>
          )}

          {/* 게임 오버 화면 */}
          {gameState === 'gameOver' && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h2 style={{fontSize: '32px', marginBottom: '20px', color: '#ef4444'}}>
                TEST COMPLETE!
                </h2>
              <div style={{marginBottom: '25px'}}>
                <div style={{fontSize: '18px', marginBottom: '10px'}}>Game Score: {score}</div>
                
                {/* 음성 범위 결과 */}
                <div style={{background: 'rgba(34, 197, 94, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '15px'}}>
                  <h3 style={{margin: '0 0 10px 0', color: '#22c55e'}}>🎵 Your Voice Range</h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px'}}>
                    <div style={{textAlign: 'center'}}>
                      <div style={{color: '#ef4444', fontWeight: 'bold'}}>Lowest: {pitchRange.minNote || '---'}</div>
                      <div style={{fontSize: '12px', color: '#94a3b8'}}>
                        {pitchRange.minPitch !== Infinity ? `${Math.round(pitchRange.minPitch)}Hz` : '---'}
                      </div>
                    </div>
                    <div style={{textAlign: 'center'}}>
                      <div style={{color: '#22c55e', fontWeight: 'bold'}}>Highest: {pitchRange.maxNote || '---'}</div>
                      <div style={{fontSize: '12px', color: '#94a3b8'}}>
                        {pitchRange.maxPitch ? `${Math.round(pitchRange.maxPitch)}Hz` : '---'}
                      </div>
                    </div>
                  </div>
                  <div style={{textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#3b82f6'}}>
                    Range: {pitchDisplay.range}Hz ({pitchDisplay.semitones} semitones)
                  </div>
                  </div>
                </div>
                
                {recordedBlob && (
                <div style={{marginBottom: '20px', padding: '15px', background: 'rgba(55, 65, 81, 0.5)', borderRadius: '10px'}}>
                  <p style={{marginBottom: '10px', fontSize: '14px', color: '#94a3b8'}}>
                    🎵 Your Voice Recording
                  </p>
                  <audio controls src={URL.createObjectURL(recordedBlob)} style={{width: '100%', marginBottom: '10px'}} />
                    <button
                      onClick={downloadRecording}
                    style={{...styles.button, fontSize: '14px', padding: '8px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                    >
                    <Download size={16} />
                    Download
                    </button>
                  </div>
                )}
                
              <div style={{display: 'flex', gap: '15px', flexDirection: 'column', alignItems: 'center'}}>
                <button
                  style={{...styles.button, background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', minWidth: '200px'}}
                  onClick={handleViewRecommendations}
                  onMouseOver={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  <Music size={20} />
                  추천 곡 보기
                </button>
                <button
                  style={{...styles.button, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', minWidth: '200px'}}
                  onClick={() => setGameState('menu')}
                  onMouseOver={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  <RotateCcw size={20} />
                  TEST AGAIN
                </button>
              </div>
            </div>
        </div>
        )}

        {/* 추천 곡 화면 */}
        {gameState === 'recommendations' && (
          <div style={styles.modal}>
            <div style={{...styles.modalContent, maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto'}}>
              <h2 style={{fontSize: '32px', marginBottom: '20px', color: '#8b5cf6', textAlign: 'center'}}>
                🎵 추천 곡
              </h2>
              <div style={{marginBottom: '25px', textAlign: 'center'}}>
                <p style={{fontSize: '16px', color: '#94a3b8', marginBottom: '10px'}}>
                  당신의 음역대 <span style={{color: '#22c55e', fontWeight: 'bold'}}>{pitchRange.minNote}</span> ~ <span style={{color: '#ef4444', fontWeight: 'bold'}}>{pitchRange.maxNote}</span>에 맞는 곡들을 추천해드립니다
                </p>
                <div style={{display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px'}}>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '14px', color: '#94a3b8'}}>음역대 범위</div>
                    <div style={{fontSize: '18px', fontWeight: 'bold', color: '#3b82f6'}}>
                      {Math.round(pitchRange.maxPitch - pitchRange.minPitch)}Hz
              </div>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <div style={{fontSize: '14px', color: '#94a3b8'}}>게임 점수</div>
                    <div style={{fontSize: '18px', fontWeight: 'bold', color: '#f59e0b'}}>
                      {score}점
                    </div>
                  </div>
                </div>
              </div>

              {/* 추천 곡 목록 */}
              <div style={{display: 'grid', gap: '15px', marginBottom: '25px'}}>
                {recommendedSongsList.map((song, index) => (
                  <div key={song.id} style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      color: 'white',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{flex: 1}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px'}}>
                        <h3 style={{margin: 0, fontSize: '18px', color: '#fff', fontWeight: 'bold'}}>
                          {song.title}
                        </h3>
                        <div style={{
                          background: song.difficulty === 'easy' ? '#22c55e' : song.difficulty === 'medium' ? '#f59e0b' : '#ef4444',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {song.difficulty === 'easy' ? '쉬움' : song.difficulty === 'medium' ? '보통' : '어려움'}
                        </div>
                      </div>
                      <p style={{margin: '0 0 5px 0', color: '#94a3b8', fontSize: '14px'}}>
                        {song.artist} • {song.genre} • {song.duration}
                      </p>
                      <p style={{margin: 0, color: '#a78bfa', fontSize: '13px'}}>
                        {song.reason}
                </p>
              </div>
                    <div style={{textAlign: 'center'}}>
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid rgba(139, 92, 246, 0.4)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        marginBottom: '5px'
                      }}>
                        <div style={{fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6'}}>
                          {song.matchScore}%
            </div>
                        <div style={{fontSize: '10px', color: '#94a3b8'}}>매칭</div>
            </div>
                      <div style={{display: 'flex', gap: '5px'}}>
                        <button style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.4)',
                          color: '#22c55e',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Star size={12} />
                          저장
                        </button>
                        <button style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          color: '#3b82f6',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Play size={12} />
                          재생
                        </button>
          </div>
        </div>
                  </div>
                ))}
              </div>

              <div style={{display: 'flex', gap: '15px', justifyContent: 'center'}}>
                <button
                  style={{...styles.button, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'}}
                  onClick={handleBackToMenu}
                  onMouseOver={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  <ArrowRight size={20} />
                  추천 페이지로 이동
                </button>
                <button
                  style={{...styles.button, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                  onClick={() => setGameState('menu')}
                  onMouseOver={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    (e.target as HTMLElement).style.transform = 'scale(1)';
                  }}
                >
                  <RotateCcw size={20} />
                  다시 테스트
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div style={{marginTop: '20px', padding: '15px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '12px', maxWidth: '600px', textAlign: 'center'}}>
        <p style={{color: '#94a3b8', fontSize: '14px', margin: '0 0 10px 0'}}>
          💡 다양한 높이의 소리를 내어 본인의 음성 범위를 측정해보세요. "아~"부터 높은 "이~"까지!
        </p>
        <p style={{color: '#94a3b8', fontSize: '12px', margin: 0}}>
          🎯 이 게임의 목표는 최대한 넓은 음성 범위를 발견하는 것입니다.
        </p>
      </div>
    </div>
  );
};

export default FlappyNoteGame;