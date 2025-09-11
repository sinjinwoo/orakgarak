import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Download, RotateCcw, TrendingUp, TrendingDown, Music, Star, Heart, Home, X, StopCircle } from 'lucide-react';

// 사이버펑크 네온 색상 팔레트
const CYBERPUNK_COLORS = [
  { primary: '#ff0080', secondary: '#ff40a0', shadow: 'rgba(255, 0, 128, 0.5)' },
  { primary: '#00ffff', secondary: '#40ffff', shadow: 'rgba(0, 255, 255, 0.5)' },
  { primary: '#00ff41', secondary: '#40ff61', shadow: 'rgba(0, 255, 65, 0.5)' },
  { primary: '#8000ff', secondary: '#a040ff', shadow: 'rgba(128, 0, 255, 0.5)' },
  { primary: '#ff4000', secondary: '#ff6040', shadow: 'rgba(255, 64, 0, 0.5)' },
  { primary: '#ffff00', secondary: '#ffff40', shadow: 'rgba(255, 255, 0, 0.5)' },
  { primary: '#ff6b00', secondary: '#ff8b40', shadow: 'rgba(255, 107, 0, 0.5)' },
];

// 추천 곡 데이터
const recommendedSongs = [
  {
    id: 1,
    title: "Yesterday",
    artist: "The Beatles",
    genre: "팝",
    duration: "2:05",
    difficulty: "easy",
    vocalRange: { min: 200, max: 350 },
    matchScore: 95
  },
  {
    id: 2,
    title: "Shape of You",
    artist: "Ed Sheeran", 
    genre: "팝",
    duration: "3:53",
    difficulty: "medium",
    vocalRange: { min: 180, max: 400 },
    matchScore: 88
  },
  {
    id: 3,
    title: "Bohemian Rhapsody",
    artist: "Queen",
    genre: "록",
    duration: "5:55",
    difficulty: "hard",
    vocalRange: { min: 150, max: 500 },
    matchScore: 75
  },
  {
    id: 4,
    title: "Someone Like You",
    artist: "Adele",
    genre: "발라드",
    duration: "4:45",
    difficulty: "medium",
    vocalRange: { min: 170, max: 380 },
    matchScore: 82
  },
  {
    id: 5,
    title: "Perfect",
    artist: "Ed Sheeran",
    genre: "팝",
    duration: "4:23",
    difficulty: "easy",
    vocalRange: { min: 190, max: 340 },
    matchScore: 90
  }
];

interface PipeData {
  id: number;
  x: number;
  topHeight: number;
  bottomHeight: number;
  passed: boolean;
  color: typeof CYBERPUNK_COLORS[0];
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

const FlappyNoteGame: React.FC<VoiceTestGameProps> = ({ onTestComplete, onTestCancel }) => {
  // 게임 상수
  const GAME_WIDTH = window.innerWidth;
  const GAME_HEIGHT = window.innerHeight;
  const CHARACTER_SIZE = 35;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 280;
  const PIPE_SPEED = 2.5;
  const MAX_LIVES = 3;
  const MIN_SCORE_FOR_RECOMMENDATIONS = 15;
  const PIPE_INTERVAL = 2000; // 파이프 생성 주기 조정
  const PIPE_SPACING = 200; // 파이프 간의 최소 간격 (새로운 상수) // 3.5초마다 생성
  const INVULNERABLE_TIME = 2000;
  const CHARACTER_SMOOTH_FACTOR = 0.04; // 더 부드러운 움직임

  // 게임 상태
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'recommendations'>('menu');
  const [characterY, setCharacterY] = useState(GAME_HEIGHT / 2);
  const [targetCharacterY, setTargetCharacterY] = useState(GAME_HEIGHT / 2);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  const [pitchRange, setPitchRange] = useState<PitchRange>({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
  const [recommendedSongsList, setRecommendedSongsList] = useState<typeof recommendedSongs>([]);
  const [characterColor, setCharacterColor] = useState(CYBERPUNK_COLORS[0]);
  const [debugInfo, setDebugInfo] = useState({
    micLevel: 0,
    frequency: 0,
    note: '',
    isDetecting: false
  });

  // refs
  const gameLoopRef = useRef<number | null>(null);
  const pipeSpawnerRef = useRef<NodeJS.Timeout | null>(null);
  const colorChangeRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const pipeIdCounterRef = useRef(0);
  const lastPipeXRef = useRef(GAME_WIDTH);

  // 유틸리티 함수
  const getRandomColor = useCallback(() => {
    return CYBERPUNK_COLORS[Math.floor(Math.random() * CYBERPUNK_COLORS.length)];
  }, []);

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

  // 파이프 생성
  const createPipe = useCallback((): PipeData => {
    const minTopHeight = 80;
    let targetGapCenter = characterY;
    
    const minGapCenter = PIPE_GAP / 2 + 50;
    const maxGapCenter = GAME_HEIGHT - PIPE_GAP / 2 - 50;
    targetGapCenter = Math.max(minGapCenter, Math.min(maxGapCenter, targetGapCenter));
    
    const randomOffset = (Math.random() - 0.5) * 100;
    targetGapCenter = Math.max(minGapCenter, Math.min(maxGapCenter, targetGapCenter + randomOffset));
    
    const topHeight = targetGapCenter - PIPE_GAP / 2;
    const bottomHeight = GAME_HEIGHT - (targetGapCenter + PIPE_GAP / 2);
    
    pipeIdCounterRef.current += 1;

    return {
      id: pipeIdCounterRef.current,
      x: GAME_WIDTH,
      topHeight: Math.max(minTopHeight, topHeight),
      bottomHeight: Math.max(50, bottomHeight),
      passed: false,
      color: getRandomColor()
    };
  }, [characterY, GAME_HEIGHT, GAME_WIDTH, getRandomColor]);

  // 향상된 충돌 감지
  const checkCollisions = useCallback((charY: number, pipeList: PipeData[]): boolean => {
    // 화면 경계 체크
    if (charY < 0 || charY > GAME_HEIGHT - CHARACTER_SIZE) {
      return true;
    }
    
    const charLeft = 100;
    const charRight = charLeft + CHARACTER_SIZE;
    const charTop = charY;
    const charBottom = charY + CHARACTER_SIZE;
    
    // 파이프 경계에 맞춘 충돌 감지
    const collisionMargin = 0;
    
    for (const pipe of pipeList) {
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;
      
      if (charRight > pipeLeft + collisionMargin && charLeft < pipeRight - collisionMargin) {
        if (charTop < pipe.topHeight - collisionMargin || charBottom > GAME_HEIGHT - pipe.bottomHeight + collisionMargin) {
          return true;
        }
      }
    }
    
    return false;
  }, [GAME_HEIGHT]);

  // 피치 분석
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
      
      // 부드러운 캐릭터 제어
      if (gameState === 'playing') {
        const minFreq = 150;
        const maxFreq = 400;
        const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
        const newTargetY = GAME_HEIGHT - (normalizedFreq * (GAME_HEIGHT - 120)) - 60;
        setTargetCharacterY(newTargetY);
      }
    }
    
    setDebugInfo({
      micLevel: Math.round(micLevel),
      frequency: Math.round(frequency),
      note: currentPitch ? `${currentPitch.note}${currentPitch.octave}` : '',
      isDetecting: frequency > 0
    });
  }, [gameState, currentPitch, frequencyToNote, detectFundamentalFrequency, GAME_HEIGHT]);

  // 마이크 초기화
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

  // 게임 로직
  const startGame = useCallback(() => {
    setGameState('playing');
    setCharacterY(GAME_HEIGHT / 2);
    setTargetCharacterY(GAME_HEIGHT / 2);
    // 첫 파이프를 즉시 생성하여 화면에 보이도록 함
    setPipes([createPipe()]);
    setScore(0);
    setLives(MAX_LIVES);
    setIsInvulnerable(false);
    setRecordedBlob(null);
    setPitchRange({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
    setCharacterColor(getRandomColor());
    lastPipeXRef.current = GAME_WIDTH;
    pipeIdCounterRef.current = 0;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      recordedChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  }, [GAME_HEIGHT, MAX_LIVES, getRandomColor, GAME_WIDTH]);

  const pauseGame = useCallback(() => {
    setGameState('paused');
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    if (pipeSpawnerRef.current) {
      clearInterval(pipeSpawnerRef.current);
      pipeSpawnerRef.current = null;
    }
    
    if (colorChangeRef.current) {
      clearInterval(colorChangeRef.current);
      colorChangeRef.current = null;
    }
  }, []);

  const resumeGame = useCallback(() => {
    setGameState('playing');
  }, []);

  const quitGame = useCallback(() => {
    setGameState('menu');
    setCharacterY(GAME_HEIGHT / 2);
    setTargetCharacterY(GAME_HEIGHT / 2);
    setPipes([]);
    setScore(0);
    setLives(MAX_LIVES);
    setIsInvulnerable(false);
    setPitchRange({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
    setRecommendedSongsList([]);
    setCharacterColor(getRandomColor());
    
    // 모든 타이머와 루프 정리
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    if (pipeSpawnerRef.current) {
      clearInterval(pipeSpawnerRef.current);
      pipeSpawnerRef.current = null;
    }
    
    if (colorChangeRef.current) {
      clearInterval(colorChangeRef.current);
      colorChangeRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [GAME_HEIGHT, MAX_LIVES, getRandomColor]);

  const gameOver = useCallback(() => {
    setGameState('gameOver');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    
    if (pipeSpawnerRef.current) {
      clearInterval(pipeSpawnerRef.current);
      pipeSpawnerRef.current = null;
    }

    if (colorChangeRef.current) {
      clearInterval(colorChangeRef.current);
      colorChangeRef.current = null;
    }
  }, []);

  // 최적화된 게임 루프
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    // 부드러운 캐릭터 움직임
    setCharacterY(prev => {
      const diff = targetCharacterY - prev;
      return prev + diff * CHARACTER_SMOOTH_FACTOR;
    });
    
    // 파이프 업데이트
    setPipes(prevPipes => {
      const newPipes = prevPipes
        .map(pipe => ({ ...pipe, x: pipe.x - PIPE_SPEED }))
        .filter(pipe => pipe.x > -PIPE_WIDTH);
      
      // 점수 계산
      newPipes.forEach(pipe => {
        if (!pipe.passed && pipe.x < 100 - CHARACTER_SIZE) {
          pipe.passed = true;
          setScore(prev => prev + 1);
        }
      });
      
      return newPipes;
    });
    
    // 충돌 감지
    if (!isInvulnerable) {
      setPipes(currentPipes => {
        if (checkCollisions(characterY, currentPipes)) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              gameOver();
            } else {
              setIsInvulnerable(true);
              setTimeout(() => {
                setIsInvulnerable(false);
              }, INVULNERABLE_TIME);
            }
            return newLives;
          });
        }
        return currentPipes;
      });
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, targetCharacterY, characterY, isInvulnerable, checkCollisions, gameOver]);

  // 규칙적인 파이프 생성
  const startPipeSpawner = useCallback(() => {
    if (pipeSpawnerRef.current) {
      clearInterval(pipeSpawnerRef.current);
    }
    
    pipeSpawnerRef.current = setInterval(() => {
      // 주기적으로 항상 새로운 파이프를 생성 (간격 관리는 PIPE_INTERVAL로만)
      setPipes(prev => [...prev, createPipe()]);
    }, PIPE_INTERVAL);
  }, [createPipe, PIPE_INTERVAL]);

  // 색상 변경
  useEffect(() => {
    if (gameState === 'playing') {
      colorChangeRef.current = setInterval(() => {
        setCharacterColor(getRandomColor());
      }, 2500);
    }

    return () => {
      if (colorChangeRef.current) {
        clearInterval(colorChangeRef.current);
      }
    };
  }, [gameState, getRandomColor]);

  // 게임 시작 시 루프와 스포너 시작
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      startPipeSpawner();
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (pipeSpawnerRef.current) {
        clearInterval(pipeSpawnerRef.current);
        pipeSpawnerRef.current = null;
      }
    };
  }, [gameState, gameLoop, startPipeSpawner]);

  // 초기화
  useEffect(() => {
    initMicrophone();
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (pipeSpawnerRef.current) clearInterval(pipeSpawnerRef.current);
      if (colorChangeRef.current) clearInterval(colorChangeRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [initMicrophone]);

  // 피치 분석 실행
  useEffect(() => {
    const interval = setInterval(analyzePitch, 100);
    return () => clearInterval(interval);
  }, [analyzePitch]);

  // 추천 시스템
  const generateRecommendations = useCallback(() => {
    if (pitchRange.minPitch === Infinity || pitchRange.maxPitch === 0) return;

    const userMinFreq = pitchRange.minPitch;
    const userMaxFreq = pitchRange.maxPitch;
    const userRange = userMaxFreq - userMinFreq;

    const scoredSongs = recommendedSongs.map(song => {
      const rangeOverlap = Math.min(userMaxFreq, song.vocalRange.max) - Math.max(userMinFreq, song.vocalRange.min);
      const rangeMatch = rangeOverlap > 0 ? (rangeOverlap / Math.max(userRange, song.vocalRange.max - song.vocalRange.min)) * 100 : 0;
      
      const difficultyBonus = song.difficulty === 'easy' ? 20 : song.difficulty === 'medium' ? 10 : 0;
      const finalScore = Math.min(100, Math.round(rangeMatch + difficultyBonus + Math.random() * 10));
      
      return {
        ...song,
        matchScore: finalScore,
        reason: rangeMatch > 70 ? '당신의 음역대와 완벽하게 맞습니다!' :
                 rangeMatch > 50 ? '음역대가 잘 맞는 편입니다' :
                 '도전적인 곡이지만 연습하면 가능합니다'
      };
    });

    const topRecommendations = scoredSongs
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    setRecommendedSongsList(topRecommendations);
  }, [pitchRange]);

  const handleViewRecommendations = useCallback(() => {
    if (score < MIN_SCORE_FOR_RECOMMENDATIONS) {
      alert(`추천을 받으려면 최소 ${MIN_SCORE_FOR_RECOMMENDATIONS}점 이상이 필요합니다. 현재 점수: ${score}점`);
      return;
    }
    
    generateRecommendations();
    setGameState('recommendations');
    
    if (onTestComplete) {
      onTestComplete([{
        pitchRange,
        score,
        timestamp: Date.now()
      }]);
    }
  }, [generateRecommendations, pitchRange, score, onTestComplete]);

  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setPitchRange({ minPitch: Infinity, maxPitch: 0, minNote: '', maxNote: '' });
    setScore(0);
    setLives(MAX_LIVES);
    setIsInvulnerable(false);
    setRecordedBlob(null);
  }, [MAX_LIVES]);

  const downloadRecording = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `음성범위테스트-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getPitchRangeDisplay = () => {
    if (pitchRange.minPitch === Infinity) return { range: 0, semitones: 0 };
    const range = pitchRange.maxPitch - pitchRange.minPitch;
    const semitones = Math.round(12 * Math.log2(pitchRange.maxPitch / pitchRange.minPitch));
    return { range: Math.round(range), semitones };
  };

  const pitchDisplay = getPitchRangeDisplay();

  return (
    <div className="cyberpunk-container">
      <div className="background-grid"></div>
      <div className="neon-particles">
        {[...Array(25)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            backgroundColor: CYBERPUNK_COLORS[Math.floor(Math.random() * CYBERPUNK_COLORS.length)].primary
          }}></div>
        ))}
      </div>
      
      {gameState === 'menu' && (
        <div className="content">
          <button 
            className="exit-button"
            onClick={onTestCancel}
            title="나가기"
          >
            <X size={24} />
          </button>
          
          <div className="title-section">
            <h1 className="cyberpunk-title">
              <span className="glitch" data-text="음성 범위 테스터">음성 범위 테스터</span>
            </h1>
            <p className="subtitle">뉴럴 음성 분석 시스템 v2.0</p>
          </div>

          <div className="control-panel">
            <div className="panel-grid">
              <div className="status-card">
                <div className="card-header">
                  <div className="status-indicator active"></div>
                  <span>마이크 레벨</span>
                </div>
                <div className="value">{debugInfo.micLevel}%</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, debugInfo.micLevel)}%` }}></div>
                </div>
              </div>
              
              <div className="status-card">
                <div className="card-header">
                  <div className="status-indicator active"></div>
                  <span>주파수</span>
                </div>
                <div className="value">{debugInfo.frequency}Hz</div>
                <div className="sub-value">{debugInfo.note || '---'}</div>
              </div>
              
              <div className="status-card">
                <div className="card-header">
                  <div className={`status-indicator ${isRecording ? 'recording' : ''}`}></div>
                  <span>상태</span>
                </div>
                <div className="value">{isRecording ? '녹음중' : '대기중'}</div>
                <div className="sub-value">{debugInfo.isDetecting ? '감지됨' : '대기'}</div>
              </div>
            </div>
            
            <div className="voice-range-panel">
              <div className="panel-title">
                <span className="icon">🎯</span>
                음성 범위 분석
              </div>
              <div className="range-display">
                <div className="range-item">
                  <div className="range-label">
                    <TrendingDown size={16} />
                    최저음
                  </div>
                  <div className="range-value low">{pitchRange.minNote || '---'}</div>
                  <div className="range-freq">
                    {pitchRange.minPitch !== Infinity ? `${Math.round(pitchRange.minPitch)}Hz` : '---'}
                  </div>
                </div>
                
                <div className="range-separator">
                  <div className="separator-line"></div>
                  <div className="separator-dot"></div>
                  <div className="separator-line"></div>
                </div>
                
                <div className="range-item">
                  <div className="range-label">
                    <TrendingUp size={16} />
                    최고음
                  </div>
                  <div className="range-value high">{pitchRange.maxNote || '---'}</div>
                  <div className="range-freq">
                    {pitchRange.maxPitch ? `${Math.round(pitchRange.maxPitch)}Hz` : '---'}
                  </div>
                </div>
              </div>
              
              <div className="range-summary">
                <div className="summary-item">
                  <span>범위:</span>
                  <span className="summary-value">{pitchDisplay.range}Hz</span>
                </div>
                <div className="summary-item">
                  <span>반음계:</span>
                  <span className="summary-value">{pitchDisplay.semitones}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="help-panel">
            <div className="help-content">
              <div className="help-text">
                💡 낮은 "아" 소리부터 높은 "이" 소리까지 다양한 음높이로 발성하여 완전한 음성 범위를 측정하세요
              </div>
              <div className="help-subtext">
                🎯 목표: 당신의 목소리의 가장 넓은 범위를 발견하기
              </div>
              <div className="score-requirement">
                ⭐ 추천 곡을 받으려면 최소 {MIN_SCORE_FOR_RECOMMENDATIONS}점 이상 필요합니다!
              </div>
            </div>
          </div>

          <div className="start-game-container">
            <div className="game-modal">
              <div className="modal-content">
                <h2 className="modal-title">뉴럴 음성 분석</h2>
                <div className="mission-briefing">
                  <div className="briefing-item">
                    <span className="briefing-icon">🎯</span>
                    <span>목적: 음성 범위 측정</span>
                  </div>
                  <div className="briefing-item">
                    <span className="briefing-icon">🔊</span>
                    <span>높은 음 → 부드럽게 위로 이동</span>
                  </div>
                  <div className="briefing-item">
                    <span className="briefing-icon">🔉</span>
                    <span>낮은 음 → 부드럽게 아래로 이동</span>
                  </div>
                  <div className="briefing-item">
                    <span className="briefing-icon">⚡</span>
                    <span>범위 테스트 중 장애물 피하기</span>
                  </div>
                  <div className="briefing-item important">
                    <span className="briefing-icon">❤️</span>
                    <span>생명: {MAX_LIVES}개 | 추천 최소 점수: {MIN_SCORE_FOR_RECOMMENDATIONS}점</span>
                  </div>
                </div>
                <div className="button-group">
                  <button className="cyber-button primary" onClick={startGame}>
                    <Play size={20} />
                    <span>테스트 시작</span>
                  </button>
                  <button className="cyber-button secondary" onClick={onTestCancel}>
                    <X size={20} />
                    <span>나가기</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-container fullscreen">
          <div 
            className={`character ${isInvulnerable ? 'invulnerable' : ''}`}
            style={{ 
              top: `${characterY}px`,
              '--character-color': characterColor.primary,
              '--character-secondary': characterColor.secondary,
              '--character-shadow': characterColor.shadow
            } as React.CSSProperties}
          >
            <div className="character-glow"></div>
          </div>

          {pipes.map(pipe => (
            <div key={pipe.id}>
              <div 
                className="pipe pipe-top"
                style={{
                  left: `${pipe.x}px`,
                  height: `${pipe.topHeight}px`,
                  '--pipe-color': pipe.color.primary,
                  '--pipe-secondary': pipe.color.secondary,
                  '--pipe-shadow': pipe.color.shadow
                } as React.CSSProperties}
              />
              <div 
                className="pipe pipe-bottom"
                style={{
                  left: `${pipe.x}px`,
                  height: `${pipe.bottomHeight}px`,
                  '--pipe-color': pipe.color.primary,
                  '--pipe-secondary': pipe.color.secondary,
                  '--pipe-shadow': pipe.color.shadow
                } as React.CSSProperties}
              />
            </div>
          ))}

          <div className="game-hud">
            <div className="hud-left">
              <div className="score-display">
                <div className="hud-label">점수</div>
                <div className="hud-value">{score}</div>
              </div>
              
              <div className="lives-display">
                <div className="hud-label">생명</div>
                <div className="lives-hearts">
                  {Array.from({ length: MAX_LIVES }, (_, i) => (
                    <Heart 
                      key={i} 
                      size={20} 
                      className={i < lives ? 'heart-full' : 'heart-empty'}
                      fill={i < lives ? '#ff0040' : 'none'}
                    />
                  ))}
                </div>
              </div>
              
              <button 
                className="pause-game-button"
                onClick={pauseGame}
                title="일시정지"
                type="button"
              >
                <StopCircle size={20} />
              </button>
            </div>
            
            {currentPitch && (
              <div className="pitch-display">
                <div className="pitch-note">{currentPitch.note}{currentPitch.octave}</div>
                <div className="pitch-freq">{Math.round(currentPitch.frequency)}Hz</div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="game-container fullscreen">
          <div className="game-modal">
            <div className="modal-content">
              <h2 className="modal-title">게임 일시정지</h2>
              
              <div className="pause-info">
                <div className="pause-stats">
                  <div className="stat-item">
                    <span className="stat-label">현재 점수</span>
                    <span className="stat-value">{score}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">남은 생명</span>
                    <span className="stat-value">{lives}</span>
                  </div>
                </div>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="cyber-button primary" 
                  onClick={resumeGame}
                  type="button"
                >
                  <Play size={20} />
                  <span>계속하기</span>
                </button>
                <button 
                  className="cyber-button secondary" 
                  onClick={() => {
                    quitGame();
                    onTestCancel?.();
                  }}
                  type="button"
                >
                  <X size={20} />
                  <span>나가기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'gameOver' && (
        <div className="game-container fullscreen">
          <div className="game-modal">
            <div className="modal-content large">
              <h2 className="modal-title">분석 완료</h2>
              
              <div className="results-grid">
                <div className="result-card">
                  <div className="result-label">성능 점수</div>
                  <div className="result-value">{score}</div>
                  <div className="result-status">
                    {score >= MIN_SCORE_FOR_RECOMMENDATIONS ? 
                      <span className="status-success">✅ 추천 가능!</span> : 
                      <span className="status-warning">⚠️ 추천 불가 (최소 {MIN_SCORE_FOR_RECOMMENDATIONS}점)</span>
                    }
                  </div>
                </div>
                
                <div className="result-card range-card">
                  <div className="result-label">감지된 음성 범위</div>
                  <div className="range-result">
                    <div className="range-bounds">
                      <span className="low-bound">{pitchRange.minNote || '---'}</span>
                      <span className="range-arrow">→</span>
                      <span className="high-bound">{pitchRange.maxNote || '---'}</span>
                    </div>
                    <div className="range-stats">
                      {pitchDisplay.range}Hz ({pitchDisplay.semitones} 반음계)
                    </div>
                  </div>
                </div>
              </div>
              
              {recordedBlob && (
                <div className="audio-panel">
                  <div className="panel-title">🎵 음성 샘플</div>
                  <audio controls src={URL.createObjectURL(recordedBlob)} className="audio-player" />
                  <button className="cyber-button secondary" onClick={downloadRecording}>
                    <Download size={16} />
                    <span>다운로드</span>
                  </button>
                </div>
              )}
              
              <div className="action-buttons">
                <button 
                  className={`cyber-button ${score >= MIN_SCORE_FOR_RECOMMENDATIONS ? 'primary' : 'disabled'} large`} 
                  onClick={handleViewRecommendations}
                  disabled={score < MIN_SCORE_FOR_RECOMMENDATIONS}
                >
                  <Music size={20} />
                  <span>추천 곡 생성</span>
                </button>
                <button className="cyber-button secondary" onClick={() => setGameState('menu')}>
                  <RotateCcw size={20} />
                  <span>분석 재시작</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === 'recommendations' && (
        <div className="game-container fullscreen">
          <div className="game-modal">
            <div className="modal-content xl">
              <h2 className="modal-title">추천 곡</h2>
              
              <div className="rec-summary">
                <div className="summary-text">
                  당신의 음성 범위 <span className="range-highlight">{pitchRange.minNote}</span> ~ <span className="range-highlight">{pitchRange.maxNote}</span>를 기반으로 한 추천
                </div>
                <div className="summary-stats">
                  <div className="stat">
                    <span>범위:</span>
                    <span>{Math.round(pitchRange.maxPitch - pitchRange.minPitch)}Hz</span>
                  </div>
                  <div className="stat">
                    <span>점수:</span>
                    <span>{score}점</span>
                  </div>
                </div>
              </div>

              <div className="recommendations-list">
                {recommendedSongsList.map((song, index) => (
                  <div key={song.id} className="recommendation-card">
                    <div className="rec-rank">#{index + 1}</div>
                    <div className="rec-content">
                      <div className="rec-header">
                        <h3 className="rec-title">{song.title}</h3>
                        <div className={`difficulty-badge ${song.difficulty}`}>
                          {song.difficulty === 'easy' ? '쉬움' : song.difficulty === 'medium' ? '보통' : '어려움'}
                        </div>
                      </div>
                      <div className="rec-info">
                        <span>{song.artist}</span>
                        <span>•</span>
                        <span>{song.genre}</span>
                        <span>•</span>
                        <span>{song.duration}</span>
                      </div>
                      <div className="rec-reason">음성 범위와 잘 맞는 곡입니다</div>
                    </div>
                    <div className="rec-score">
                      <div className="match-score">{song.matchScore}%</div>
                      <div className="match-label">일치도</div>
                      <div className="rec-actions">
                        <button className="action-btn save">
                          <Star size={12} />
                        </button>
                        <button className="action-btn play">
                          <Play size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="action-buttons">
                <button className="cyber-button secondary" onClick={handleBackToMenu}>
                  <Home size={20} />
                  <span>메인으로</span>
                </button>
                <button className="cyber-button primary" onClick={() => setGameState('menu')}>
                  <RotateCcw size={20} />
                  <span>새로운 분석</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cyberpunk-container {
          min-height: 100vh;
          background: 
            radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(128, 0, 255, 0.12) 0%, transparent 50%),
            linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f1419 100%);
          position: relative;
          overflow: hidden;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Courier New', monospace;
        }

        .background-grid {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
          z-index: 1;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }

        .neon-particles {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 2;
        }

        .particle {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          animation: float 4s infinite ease-in-out;
          box-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
        }

        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
            opacity: 0.4;
          }
          50% { 
            transform: translateY(-30px) translateX(15px) scale(1.5);
            opacity: 1;
          }
        }

        .content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .title-section {
          text-align: center;
          margin-bottom: 20px;
        }

        .cyberpunk-title {
          font-size: clamp(28px, 5vw, 56px);
          font-weight: 900;
          color: #00ffff;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 4px;
          position: relative;
        }

        .glitch {
          position: relative;
          animation: glitch 3s infinite;
        }

        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch::before {
          animation: glitch-1 0.8s infinite;
          color: #ff0080;
          z-index: -1;
        }

        .glitch::after {
          animation: glitch-2 0.8s infinite;
          color: #8000ff;
          z-index: -2;
        }

        @keyframes glitch {
          0%, 98% { transform: none; }
          1% { transform: skew(-0.8deg, -0.9deg); }
          2% { transform: skew(0.9deg, -0.2deg); }
        }

        @keyframes glitch-1 {
          0% { transform: translateX(0); }
          20% { transform: translateX(-3px); }
          40% { transform: translateX(3px); }
          60% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }

        @keyframes glitch-2 {
          0% { transform: translateX(0); }
          20% { transform: translateX(2px); }
          40% { transform: translateX(-2px); }
          60% { transform: translateX(3px); }
          80% { transform: translateX(-3px); }
          100% { transform: translateX(0); }
        }

        .subtitle {
          color: #ff6b00;
          font-size: clamp(14px, 2vw, 18px);
          letter-spacing: 3px;
          text-transform: uppercase;
          opacity: 0.9;
          text-shadow: 0 0 10px rgba(255, 107, 0, 0.5);
        }

        .control-panel {
          width: 100%;
          max-width: 800px;
          background: 
            linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(26, 26, 46, 0.9) 100%);
          border: 2px solid transparent;
          background-clip: padding-box;
          border-radius: 16px;
          padding: 25px;
          position: relative;
          backdrop-filter: blur(15px);
          box-shadow: 
            0 0 40px rgba(0, 255, 255, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .control-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, #00ffff, #ff0080, #8000ff, #00ffff);
          border-radius: 16px;
          z-index: -1;
          padding: 2px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          animation: borderGlow 4s linear infinite;
        }

        @keyframes borderGlow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .panel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .status-card {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .status-card:hover {
          border-color: rgba(0, 255, 255, 0.5);
          box-shadow: 0 0 25px rgba(0, 255, 255, 0.2);
        }

        .status-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
          animation: scan 4s infinite;
        }

        @keyframes scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          font-size: 12px;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: bold;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #444;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .status-indicator.active {
          background: #00ff41;
          box-shadow: 0 0 20px #00ff41, 0 0 40px #00ff41;
          animation: pulse 2s infinite;
        }

        .status-indicator.recording {
          background: #ff0040;
          box-shadow: 0 0 20px #ff0040, 0 0 40px #ff0040;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
            transform: scale(1);
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.2);
          }
        }

        .value {
          font-size: 28px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
          margin-bottom: 5px;
        }

        .sub-value {
          font-size: 12px;
          color: #888;
          margin-top: 5px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 3px;
          margin-top: 15px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #00ffff, #ff6b00, #8000ff);
          border-radius: 3px;
          transition: width 0.3s ease;
          box-shadow: 0 0 15px currentColor;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: progressGlow 2s infinite;
        }

        @keyframes progressGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .voice-range-panel {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 107, 0, 0.4);
          border-radius: 12px;
          padding: 25px;
          margin-top: 20px;
          position: relative;
        }

        .voice-range-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(255, 107, 0, 0.05), transparent);
          border-radius: 12px;
          pointer-events: none;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #ff6b00;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 25px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .icon {
          font-size: 22px;
          filter: drop-shadow(0 0 10px currentColor);
        }

        .range-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 25px;
        }

        .range-item {
          text-align: center;
          flex: 1;
        }

        .range-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: #999;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .range-value {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 8px;
          text-shadow: 0 0 15px currentColor, 0 0 30px currentColor;
        }

        .range-value.low {
          color: #ff4444;
        }

        .range-value.high {
          color: #44ff44;
        }

        .range-freq {
          font-size: 12px;
          color: #666;
        }

        .range-separator {
          display: flex;
          align-items: center;
          flex: 0 0 80px;
          justify-content: center;
        }

        .separator-line {
          width: 25px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ffff, transparent);
          box-shadow: 0 0 8px #00ffff;
        }

        .separator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00ffff;
          margin: 0 8px;
          box-shadow: 0 0 15px #00ffff;
          animation: dotPulse 2s infinite;
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }

        .range-summary {
          display: flex;
          justify-content: space-around;
          padding: 20px;
          background: rgba(0, 255, 255, 0.08);
          border-radius: 10px;
          border: 1px solid rgba(0, 255, 255, 0.2);
          backdrop-filter: blur(5px);
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #aaa;
        }

        .summary-value {
          color: #00ffff;
          font-weight: bold;
          font-size: 18px;
          text-shadow: 0 0 15px currentColor;
        }

        .game-container {
          position: relative;
          width: min(800px, calc(100vw - 40px));
          height: min(600px, 60vh);
          background: 
            linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #0f1419 100%);
          border: 3px solid transparent;
          background-clip: padding-box;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 
            0 0 50px rgba(0, 255, 255, 0.2),
            inset 0 0 50px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .game-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, #00ffff, #ff0080, #8000ff, #00ffff);
          border-radius: 16px;
          z-index: -1;
          padding: 3px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          animation: borderGlow 4s linear infinite;
        }

        .game-container.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          border-radius: 0;
          z-index: 1000;
        }

        .character {
          position: absolute;
          width: 35px;
          height: 35px;
          left: 100px;
          transform: translate(-50%, -50%);
          z-index: 100;
          transition: opacity 0.1s ease;
        }

        .character.invulnerable {
          animation: blink 0.15s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 0.3; }
          51%, 100% { opacity: 1; }
        }

        .character::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, var(--character-color, #ff6b00) 0%, var(--character-secondary, #ff4400) 70%, transparent 100%);
          border-radius: 50%;
          border: 3px solid var(--character-color, #ffaa00);
          box-shadow: 
            0 0 25px var(--character-color, #ff6b00),
            0 0 50px var(--character-shadow, rgba(255, 107, 0, 0.3)),
            inset 0 2px 10px rgba(255, 255, 255, 0.4);
        }

        .character-glow {
          position: absolute;
          width: 70px;
          height: 70px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, var(--character-shadow, rgba(255, 107, 0, 0.4)) 0%, transparent 70%);
          border-radius: 50%;
          animation: glow 2s infinite ease-in-out;
          z-index: -1;
        }

        @keyframes glow {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 0.5; 
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.3); 
            opacity: 0.8; 
          }
        }

        .pipe {
          position: absolute;
          width: 80px;
          background: 
            linear-gradient(90deg, var(--pipe-color, #ff6b00) 0%, var(--pipe-secondary, #ff4400) 50%, var(--pipe-color, #ff6b00) 100%);
          border: 3px solid var(--pipe-color, #ffaa00);
          box-shadow: 
            0 0 20px var(--pipe-shadow, rgba(255, 107, 0, 0.5)),
            0 0 40px var(--pipe-shadow, rgba(255, 107, 0, 0.3)),
            inset 0 0 15px rgba(0, 0, 0, 0.3),
            inset 0 2px 0 rgba(255, 255, 255, 0.2);
          position: relative;
        }

        .pipe::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          animation: pipeGlow 3s infinite;
        }

        @keyframes pipeGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .pipe-top {
          top: 0;
          border-radius: 0 0 12px 12px;
        }

        .pipe-bottom {
          bottom: 0;
          border-radius: 12px 12px 0 0;
        }

        .game-hud {
          position: absolute;
          top: 25px;
          left: 25px;
          right: 25px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          pointer-events: none;
          z-index: 200;
        }

        .hud-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .score-display,
        .lives-display,
        .pitch-display {
          background: rgba(0, 0, 0, 0.85);
          border: 2px solid #00ffff;
          border-radius: 12px;
          padding: 15px 20px;
          backdrop-filter: blur(10px);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }

        .hud-label {
          font-size: 10px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .hud-value,
        .pitch-note {
          font-size: 22px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 15px currentColor;
        }

        .lives-hearts {
          display: flex;
          gap: 6px;
        }

        .heart-full {
          color: #ff0040;
          filter: drop-shadow(0 0 10px #ff0040);
        }

        .heart-empty {
          color: #444;
        }

        .pitch-freq {
          font-size: 12px;
          color: #888;
          text-align: center;
          margin-top: 4px;
        }

        .pause-game-button {
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #ff0040, #ff4080);
          border: 3px solid #ff4080;
          border-radius: 12px;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 
            0 0 25px rgba(255, 0, 64, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
          z-index: 1000;
          pointer-events: auto;
          position: relative;
        }

        .pause-game-button::before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          background: linear-gradient(45deg, #ff0040, #ff4080, #ff80a0, #ff4080);
          border-radius: 15px;
          z-index: -1;
          opacity: 0.7;
          filter: blur(3px);
        }

        .pause-game-button:hover {
          background: linear-gradient(135deg, #ff4080, #ff80a0);
          border-color: #ff80a0;
          transform: scale(1.05) translateY(-2px);
          box-shadow: 
            0 0 35px rgba(255, 0, 64, 0.8),
            0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .game-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
          z-index: 1001;
          padding: 20px;
          box-sizing: border-box;
        }

        .modal-content {
          background: 
            linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(26, 26, 46, 0.95) 100%);
          border: 2px solid transparent;
          background-clip: padding-box;
          border-radius: 16px;
          padding: 35px;
          text-align: center;
          color: white;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 
            0 0 50px rgba(0, 255, 255, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .modal-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, #00ffff, #ff0080, #8000ff, #00ffff);
          border-radius: 16px;
          z-index: -1;
          padding: 2px;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          animation: borderGlow 4s linear infinite;
        }

        .modal-content.large {
          min-width: min(550px, 85vw);
        }

        .modal-content.xl {
          min-width: min(750px, 85vw);
        }

        .modal-title {
          font-size: 32px;
          margin-bottom: 30px;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 3px;
          text-shadow: 0 0 25px currentColor;
        }

        .mission-briefing {
          margin-bottom: 35px;
        }

        .briefing-item {
          display: flex;
          align-items: center;
          gap: 18px;
          margin-bottom: 18px;
          padding: 15px;
          background: rgba(0, 255, 255, 0.05);
          border-left: 4px solid #00ffff;
          border-radius: 0 8px 8px 0;
          transition: all 0.3s ease;
        }

        .briefing-item:hover {
          background: rgba(0, 255, 255, 0.1);
          border-left-color: #ff6b00;
        }

        .briefing-item.important {
          background: rgba(255, 107, 0, 0.1);
          border-left-color: #ff6b00;
        }

        .briefing-icon {
          font-size: 22px;
          min-width: 35px;
          filter: drop-shadow(0 0 10px currentColor);
        }

        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .result-card {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .result-card:hover {
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 25px rgba(0, 255, 255, 0.2);
        }

        .result-card.range-card {
          border-color: rgba(255, 107, 0, 0.4);
        }

        .result-card.range-card:hover {
          border-color: rgba(255, 107, 0, 0.6);
          box-shadow: 0 0 25px rgba(255, 107, 0, 0.2);
        }

        .result-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .result-value {
          font-size: 36px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
        }

        .result-status {
          margin-top: 12px;
          font-size: 14px;
        }

        .status-success {
          color: #00ff41;
          font-weight: bold;
          text-shadow: 0 0 10px currentColor;
        }

        .status-warning {
          color: #ff6b00;
          font-weight: bold;
          text-shadow: 0 0 10px currentColor;
        }

        .range-result {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .range-bounds {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 20px;
          font-weight: bold;
        }

        .low-bound {
          color: #ff4444;
          text-shadow: 0 0 15px currentColor;
        }

        .high-bound {
          color: #44ff44;
          text-shadow: 0 0 15px currentColor;
        }

        .range-arrow {
          color: #00ffff;
          font-size: 24px;
        }

        .range-stats {
          font-size: 15px;
          color: #ff6b00;
          text-shadow: 0 0 10px currentColor;
        }

        .audio-panel {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 107, 0, 0.4);
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .audio-player {
          width: 100%;
          margin: 20px 0;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
        }

        .rec-summary {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 107, 0, 0.4);
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          text-align: center;
        }

        .summary-text {
          font-size: 18px;
          color: #ddd;
          margin-bottom: 20px;
          line-height: 1.5;
        }

        .range-highlight {
          color: #ff6b00;
          font-weight: bold;
          text-shadow: 0 0 15px currentColor;
        }

        .summary-stats {
          display: flex;
          justify-content: center;
          gap: 40px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 16px;
        }

        .stat span:first-child {
          color: #999;
        }

        .stat span:last-child {
          color: #00ffff;
          font-weight: bold;
          text-shadow: 0 0 15px currentColor;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 30px;
          max-height: 450px;
          overflow-y: auto;
        }

        .recommendation-card {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 12px;
          padding: 25px;
          display: flex;
          align-items: center;
          gap: 25px;
          transition: all 0.3s ease;
        }

        .recommendation-card:hover {
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 25px rgba(139, 92, 246, 0.2);
          transform: translateY(-2px);
        }

        .rec-rank {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          width: 45px;
          height: 45px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
        }

        .rec-content {
          flex: 1;
          text-align: left;
        }

        .rec-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }

        .rec-title {
          margin: 0;
          font-size: 20px;
          color: white;
          font-weight: bold;
        }

        .difficulty-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .difficulty-badge.easy {
          background: #22c55e;
          color: white;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.5);
        }

        .difficulty-badge.medium {
          background: #f59e0b;
          color: white;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.5);
        }

        .difficulty-badge.hard {
          background: #ef4444;
          color: white;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
        }

        .rec-info {
          color: #999;
          font-size: 15px;
          margin-bottom: 10px;
        }

        .rec-reason {
          color: #a78bfa;
          font-size: 14px;
          font-style: italic;
        }

        .rec-score {
          text-align: center;
          flex-shrink: 0;
        }

        .match-score {
          font-size: 28px;
          font-weight: bold;
          color: #8b5cf6;
          text-shadow: 0 0 15px currentColor;
          margin-bottom: 8px;
        }

        .match-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .rec-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px;
          color: #ccc;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .action-btn.save:hover {
          color: #22c55e;
          border-color: #22c55e;
          box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
        }

        .action-btn.play:hover {
          color: #3b82f6;
          border-color: #3b82f6;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        }

        .action-buttons {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .button-group {
          display: flex;
          gap: 20px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .cyber-button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 18px 30px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          box-shadow: 
            0 6px 20px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }

        .cyber-button:hover::before {
          left: 100%;
        }

        .cyber-button:hover {
          transform: translateY(-3px);
          box-shadow: 
            0 8px 25px rgba(59, 130, 246, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .cyber-button.primary {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          box-shadow: 
            0 6px 20px rgba(139, 92, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .cyber-button.primary:hover {
          box-shadow: 
            0 8px 25px rgba(139, 92, 246, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .cyber-button.secondary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 
            0 6px 20px rgba(16, 185, 129, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .cyber-button.secondary:hover {
          box-shadow: 
            0 8px 25px rgba(16, 185, 129, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .cyber-button.disabled {
          background: linear-gradient(135deg, #666 0%, #444 100%);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .cyber-button.disabled:hover {
          transform: none;
          box-shadow: 
            0 6px 20px rgba(102, 102, 102, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .cyber-button.large {
          padding: 22px 40px;
          font-size: 18px;
        }

        .help-panel {
          width: 100%;
          max-width: 650px;
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid rgba(255, 107, 0, 0.3);
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          margin-top: 25px;
          position: relative;
        }

        .help-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(255, 107, 0, 0.05), transparent);
          border-radius: 12px;
          pointer-events: none;
        }

        .help-content {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .help-text {
          color: #ddd;
          font-size: 15px;
          line-height: 1.6;
        }

        .help-subtext {
          color: #999;
          font-size: 13px;
        }

        .score-requirement {
          color: #ff6b00;
          font-size: 15px;
          font-weight: bold;
          text-shadow: 0 0 15px currentColor;
          margin-top: 15px;
          padding: 15px;
          background: rgba(255, 107, 0, 0.1);
          border-radius: 8px;
          border: 1px solid rgba(255, 107, 0, 0.3);
        }

        .exit-button {
          position: absolute;
          top: 25px;
          right: 25px;
          width: 55px;
          height: 55px;
          background: linear-gradient(135deg, #ff0040, #ff4080);
          border: 3px solid #ff4080;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          transition: all 0.3s ease;
          box-shadow: 0 0 25px rgba(255, 0, 64, 0.5);
        }

        .exit-button:hover {
          background: linear-gradient(135deg, #ff4080, #ff80a0);
          border-color: #ff80a0;
          transform: scale(1.1);
          box-shadow: 0 0 35px rgba(255, 0, 64, 0.8);
        }

        .pause-info {
          margin-bottom: 30px;
        }

        .pause-stats {
          display: flex;
          justify-content: center;
          gap: 35px;
          margin-bottom: 25px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.6);
          border: 2px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          min-width: 120px;
        }

        .stat-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #00ffff;
          text-shadow: 0 0 15px currentColor;
        }

        /* 반응형 디자인 */
        @media (max-width: 768px) {
          .cyberpunk-container {
            padding: 15px;
          }

          .cyberpunk-title {
            font-size: 36px;
            letter-spacing: 2px;
          }

          .subtitle {
            font-size: 14px;
            letter-spacing: 2px;
          }

          .control-panel {
            padding: 20px;
          }

          .panel-grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
          }

          .status-card {
            padding: 15px;
          }

          .value {
            font-size: 22px;
          }

          .voice-range-panel {
            padding: 20px;
          }

          .range-display {
            flex-direction: column;
            gap: 20px;
          }

          .range-separator {
            transform: rotate(90deg);
          }

          .modal-content {
            padding: 25px;
            margin: 15px;
          }

          .modal-title {
            font-size: 24px;
          }

          .results-grid {
            grid-template-columns: 1fr;
          }

          .recommendation-card {
            flex-direction: column;
            text-align: center;
            gap: 20px;
          }

          .rec-content {
            text-align: center;
          }

          .action-buttons,
          .button-group {
            flex-direction: column;
            align-items: stretch;
          }

          .cyber-button {
            width: 100%;
            justify-content: center;
          }

          .help-panel {
            margin-top: 15px;
            padding: 20px;
          }

          .game-hud {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .hud-left {
            gap: 15px;
          }

          .pause-game-button {
            width: 50px;
            height: 50px;
          }

          .exit-button {
            width: 50px;
            height: 50px;
            top: 20px;
            right: 20px;
          }

          .pause-stats {
            flex-direction: column;
            gap: 20px;
          }

          .summary-stats {
            gap: 25px;
          }
        }

        @media (max-width: 480px) {
          .cyberpunk-title {
            font-size: 28px;
            letter-spacing: 1px;
          }

          .panel-grid {
            grid-template-columns: 1fr;
          }

          .range-summary {
            flex-direction: column;
            gap: 15px;
          }

          .recommendations-list {
            max-height: 350px;
          }

          .rec-rank {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }

          .summary-stats {
            flex-direction: column;
            gap: 15px;
          }
        }

        /* 스크롤바 개선 */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #00ffff, #ff6b00);
          border-radius: 5px;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #ff6b00, #8000ff);
        }

        /* 선택 텍스트 개선 */
        ::selection {
          background: rgba(0, 255, 255, 0.3);
          color: white;
        }

        ::-moz-selection {
          background: rgba(0, 255, 255, 0.3);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default FlappyNoteGame;