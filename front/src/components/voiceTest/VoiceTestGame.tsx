import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Download, RotateCcw, Mic, MicOff } from 'lucide-react';

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

const FlappyNoteGame: React.FC = () => {
  // 게임 상수
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;
  const CHARACTER_SIZE = 40;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 200;
  const PIPE_SPEED = 3;
  const GRAVITY = 0.3;
  const JUMP_STRENGTH = 8;

  // 게임 상태
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [characterY, setCharacterY] = useState(GAME_HEIGHT / 2);
  const [characterVelocity, setCharacterVelocity] = useState(0);
  const [pipes, setPipes] = useState<PipeData[]>([]);
  const [score, setScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [currentPitch, setCurrentPitch] = useState<PitchData | null>(null);
  
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

  // 음계 정보
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // 주파수를 음계로 변환
  const frequencyToNote = useCallback((frequency: number): { note: string; octave: number } => {
    if (frequency <= 0) return { note: '', octave: 0 };
    
    const A4 = 440;
    const semitone = 12 * Math.log2(frequency / A4);
    const noteNumber = Math.round(semitone) + 69;
    const octave = Math.floor(noteNumber / 12) - 1;
    const noteIndex = noteNumber % 12;
    const note = noteNames[noteIndex < 0 ? noteIndex + 12 : noteIndex];
    
    return { note, octave };
  }, []);

  // 피치 감지 함수
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

  // 피치 분석 및 캐릭터 제어
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
      
      // 주파수를 캐릭터 Y 위치로 매핑 (150Hz-400Hz를 게임 높이로 매핑)
      const minFreq = 150;
      const maxFreq = 400;
      const normalizedFreq = Math.max(0, Math.min(1, (frequency - minFreq) / (maxFreq - minFreq)));
      const targetY = GAME_HEIGHT - (normalizedFreq * (GAME_HEIGHT - 100)) - 100;
      
      if (gameState === 'playing') {
        setCharacterY(prev => {
          const diff = targetY - prev;
          return prev + diff * 0.2; // 부드러운 이동
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
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
    setCharacterVelocity(0);
    setPipes([]);
    setScore(0);
    setRecordedBlob(null);
    
    // 녹음 시작
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      recordedChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    }
  }, []);

  // 게임 오버
  const gameOver = useCallback(() => {
    setGameState('gameOver');
    
    // 녹음 중지
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // 게임 루프 중지
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    
    // 파이프 생성 중지
    if (pipeIntervalRef.current) {
      clearInterval(pipeIntervalRef.current);
    }
  }, []);

  // 충돌 감지
  const checkCollisions = useCallback((charY: number, pipeList: PipeData[]): boolean => {
    // 바닥과 천장 충돌
    if (charY < 0 || charY > GAME_HEIGHT - CHARACTER_SIZE) {
      return true;
    }
    
    // 파이프 충돌
    for (const pipe of pipeList) {
      const charLeft = 100;
      const charRight = charLeft + CHARACTER_SIZE;
      const charTop = charY;
      const charBottom = charY + CHARACTER_SIZE;
      
      const pipeLeft = pipe.x;
      const pipeRight = pipe.x + PIPE_WIDTH;
      
      // X축 겹침 확인
      if (charRight > pipeLeft && charLeft < pipeRight) {
        // 상단 파이프 또는 하단 파이프와 충돌
        if (charTop < pipe.topHeight || charBottom > GAME_HEIGHT - pipe.bottomHeight) {
          return true;
        }
      }
    }
    
    return false;
  }, []);

  // 파이프 생성
  const createPipe = useCallback((): PipeData => {
    const minTopHeight = 50;
    const maxTopHeight = GAME_HEIGHT - PIPE_GAP - 50;
    const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
    const bottomHeight = GAME_HEIGHT - topHeight - PIPE_GAP;
    
    return {
      id: Date.now() + Math.random(),
      x: GAME_WIDTH,
      topHeight,
      bottomHeight,
      passed: false
    };
  }, []);

  // 게임 루프
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;
    
    setPipes(prevPipes => {
      const newPipes = prevPipes.map(pipe => ({
        ...pipe,
        x: pipe.x - PIPE_SPEED
      })).filter(pipe => pipe.x > -PIPE_WIDTH);
      
      // 점수 업데이트
      newPipes.forEach(pipe => {
        if (!pipe.passed && pipe.x < 100 - CHARACTER_SIZE) {
          pipe.passed = true;
          setScore(prev => prev + 1);
        }
      });
      
      return newPipes;
    });
    
    // 충돌 감지
    setPipes(currentPipes => {
      if (checkCollisions(characterY, currentPipes)) {
        gameOver();
        return currentPipes;
      }
      return currentPipes;
    });
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, characterY, checkCollisions, gameOver]);

  // 게임 초기화
  useEffect(() => {
    initMicrophone();
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (pipeIntervalRef.current) {
        clearInterval(pipeIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [initMicrophone]);

  // 게임 루프 시작/중지
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      
      // 파이프 생성 간격
      pipeIntervalRef.current = setInterval(() => {
        setPipes(prev => [...prev, createPipe()]);
      }, 2000);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      if (pipeIntervalRef.current) {
        clearInterval(pipeIntervalRef.current);
      }
    };
  }, [gameState, gameLoop, createPipe]);

  // 피치 분석 주기적 실행
  useEffect(() => {
    const interval = setInterval(analyzePitch, 100);
    return () => clearInterval(interval);
  }, [analyzePitch]);

  // 녹음된 오디오 다운로드
  const downloadRecording = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flappy-note-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-200 to-blue-400 p-4">
      <div className="text-center mb-4">
        <h1 className="text-4xl font-bold text-white mb-2">🎵 Flappy Note</h1>
        <p className="text-white/80">음성 피치로 캐릭터를 조종하세요!</p>
      </div>

      {/* 디버그 정보 */}
      <div className="bg-white/20 backdrop-blur rounded-lg p-3 mb-4 text-white text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>마이크: {debugInfo.micLevel}%</div>
          <div>주파수: {debugInfo.frequency}Hz</div>
          <div>음표: {debugInfo.note}</div>
          <div className="flex items-center gap-2">
            {isRecording ? <Mic className="w-4 h-4 text-red-400" /> : <MicOff className="w-4 h-4" />}
            {isRecording ? '녹음 중' : '대기 중'}
          </div>
        </div>
      </div>

      {/* 게임 화면 */}
      <div 
        className="relative bg-gradient-to-b from-cyan-200 to-green-300 border-4 border-white rounded-lg overflow-hidden shadow-2xl"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {/* 캐릭터 */}
        {gameState !== 'menu' && (
          <div
            className="absolute w-10 h-10 bg-yellow-400 rounded-full border-2 border-yellow-600 transition-all duration-100"
            style={{
              left: '100px',
              top: `${characterY}px`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="absolute inset-1 bg-yellow-300 rounded-full">
              <div className="absolute top-1 left-2 w-1 h-1 bg-black rounded-full"></div>
              <div className="absolute top-1 right-2 w-1 h-1 bg-black rounded-full"></div>
              <div className="absolute bottom-2 left-1/2 w-2 h-1 bg-orange-500 rounded-full transform -translate-x-1/2"></div>
            </div>
          </div>
        )}

        {/* 파이프 */}
        {pipes.map(pipe => (
          <div key={pipe.id}>
            {/* 상단 파이프 */}
            <div
              className="absolute bg-green-600 border-r-4 border-green-800"
              style={{
                left: pipe.x,
                top: 0,
                width: PIPE_WIDTH,
                height: pipe.topHeight,
              }}
            />
            {/* 하단 파이프 */}
            <div
              className="absolute bg-green-600 border-r-4 border-green-800"
              style={{
                left: pipe.x,
                bottom: 0,
                width: PIPE_WIDTH,
                height: pipe.bottomHeight,
              }}
            />
          </div>
        ))}

        {/* 점수 */}
        {gameState === 'playing' && (
          <div className="absolute top-4 left-4 text-2xl font-bold text-white bg-black/30 px-3 py-1 rounded">
            점수: {score}
          </div>
        )}

        {/* 현재 피치 표시 */}
        {currentPitch && gameState === 'playing' && (
          <div className="absolute top-4 right-4 text-white bg-black/30 px-3 py-1 rounded">
            {currentPitch.note}{currentPitch.octave} ({Math.round(currentPitch.frequency)}Hz)
          </div>
        )}

        {/* 메뉴 화면 */}
        {gameState === 'menu' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-center text-white">
              <h2 className="text-3xl font-bold mb-4">게임 방법</h2>
              <p className="mb-2">높은 음을 내면 위로 올라갑니다</p>
              <p className="mb-2">낮은 음을 내면 아래로 내려갑니다</p>
              <p className="mb-6">파이프를 피해보세요!</p>
              <button
                onClick={startGame}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold text-xl transition-colors"
              >
                <Play className="w-6 h-6 inline mr-2" />
                게임 시작
              </button>
            </div>
          </div>
        )}

        {/* 게임 오버 화면 */}
        {gameState === 'gameOver' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-white p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">게임 오버!</h2>
              <p className="text-lg mb-4">최종 점수: {score}</p>
              
              {/* 녹음된 오디오 재생 */}
              {recordedBlob && (
                <div className="mb-4">
                  <p className="mb-2 text-sm text-gray-600">게임 중 녹음된 음성:</p>
                  <audio 
                    controls 
                    src={URL.createObjectURL(recordedBlob)}
                    className="mb-2"
                  />
                  <br />
                  <button
                    onClick={downloadRecording}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                </div>
              )}
              
              <button
                onClick={() => setGameState('menu')}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                다시 하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 게임 설명 */}
      <div className="mt-4 text-center text-white/80 max-w-md text-sm">
        <p>마이크 권한을 허용하고 음성으로 캐릭터를 조종하세요.</p>
        <p>높은 음(200-400Hz)일수록 캐릭터가 위로 올라갑니다.</p>
      </div>
    </div>
  );
};

export default FlappyNoteGame;