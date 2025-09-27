import React, { useEffect, useRef, useState } from 'react';
import GameExitModal from './GameExitModal';
import GameStartModal from './GameStartModal';
import GamePauseModal from './GamePauseModal';
// 선택 화면 컴포넌트들 제거
import VoiceRangeResultModal from './VoiceRangeResultModal';
// Recording 타입 import 제거 (더 이상 사용하지 않음)

// 원본 PitchCraft 게임을 그대로 가져와서 통합
const VoiceTestGame: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const [isGameLoaded, setIsGameLoaded] = useState(false);
    const gameInstanceRef = useRef<any>(null);
    const [showStartModal, setShowStartModal] = useState(true);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [showVoiceRangeResult, setShowVoiceRangeResult] = useState(false);
    const [gameOverProcessed, setGameOverProcessed] = useState(false);
    const [voiceRangeData, setVoiceRangeData] = useState<{
        highestNote?: string;
        lowestNote?: string;
        highestFrequency?: number;
        lowestFrequency?: number;
        totalScore?: number;
    }>({});
    const [pitchScores, setPitchScores] = useState<{ [key: string]: number }>({});
    const [gameInfo, setGameInfo] = useState<{
        pilotName: string;
        score: number;
        hp: number;
        pitchStatus: string;
        targetY: number;
    }>({
        pilotName: 'Pilot',
        score: 0,
        hp: 100,
        pitchStatus: '피치 감지 중...',
        targetY: 384
    });

    // 음역대별 점수 업데이트 함수
    const updatePitchScores = () => {
        const scores = (window as any).pitchScores || {};
        console.log('🎵 점수 업데이트:', scores);
        console.log('🎵 점수 개수:', Object.keys(scores).length);
        if (Object.keys(scores).length > 0) {
            console.log('🎵 점수 상세:', Object.entries(scores));
        }
        setPitchScores({ ...scores });
    };

    // 게임 정보 업데이트 함수
    const updateGameInfo = () => {
        const fighter = (window as any).fighter;
        if (fighter) {
            setGameInfo({
                pilotName: fighter.name || 'Pilot',
                score: fighter.score || 0,
                hp: fighter.hitpoints || 100,
                pitchStatus: (window as any).pitchStatus || '피치 감지 중...',
                targetY: (window as any).targetY || 384
            });
        }
    };

    // 음역대별 주파수 반환 함수 (정렬용)
    const getPitchFrequency = (pitch: string): number => {
        const pitchFreqMap: { [key: string]: number } = {
            // 2옥타브
            'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50,
            'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
            // 3옥타브
            'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00,
            'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
            // 4옥타브
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
            'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            // 5옥타브
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
            'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
            // 6옥타브
            'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98,
            'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00
        };
        return pitchFreqMap[pitch] || 0;
    };

    // 게임이 로드된 후 점수 업데이트 (이벤트 + 폴링 조합)
    React.useEffect(() => {
        if (!isGameLoaded) return;

        const handlePitchScoreUpdate = (event: CustomEvent) => {
            console.log('🎵 점수 업데이트 이벤트:', event.detail);
            setPitchScores({ ...event.detail.allScores });
        };

        // 이벤트 리스너 등록
        window.addEventListener('pitchScoreUpdate', handlePitchScoreUpdate as EventListener);

        // 폴링도 함께 사용 (이벤트가 실패할 경우를 대비)
        const interval = setInterval(() => {
            updatePitchScores();
            updateGameInfo();

            // 게임 오버 폴링 감지 → 모달 표시 보장
            if ((window as any).isGameOver && !gameOverProcessed && !showVoiceRangeResult) {
                try {
                    const fighter = (window as any).fighter || {};
                    const totalScore = fighter.score || 0;
                    const scores = (window as any).pitchScores || {};

                    const noteToFreq: { [key: string]: number } = {
                        'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50,
                        'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
                        'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00,
                        'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
                        'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
                        'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
                        'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
                        'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
                        'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98,
                        'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00
                    };

                    const freqList = Object.keys(scores)
                        .map(note => ({ note, frequency: noteToFreq[note] || 0 }))
                        .filter(v => v.frequency > 0)
                        .sort((a, b) => a.frequency - b.frequency);

                    if (freqList.length > 0) {
                        setVoiceRangeData({
                            highestNote: freqList[freqList.length - 1].note,
                            lowestNote: freqList[0].note,
                            highestFrequency: freqList[freqList.length - 1].frequency,
                            lowestFrequency: freqList[0].frequency,
                            totalScore: totalScore
                        });
                    } else {
                        setVoiceRangeData({
                            highestNote: 'C5',
                            lowestNote: 'C3',
                            highestFrequency: 523.25,
                            lowestFrequency: 130.81,
                            totalScore: totalScore
                        });
                    }

                    setGameOverProcessed(true);
                    setShowVoiceRangeResult(true);
                } catch (e) {
                    console.warn('게임 오버 폴링 처리 실패:', e);
                }
            }
        }, 50); // 0.05초마다 폴링 (매우 빠른 업데이트)

        return () => {
            window.removeEventListener('pitchScoreUpdate', handlePitchScoreUpdate as EventListener);
            clearInterval(interval);
        };
    }, [isGameLoaded, gameOverProcessed, showVoiceRangeResult]);

    const loadGameWithEventListeners = () => {
        if (!gameRef.current) return;
        console.log('🎮 게임 로드 및 이벤트 리스너 설정 시작');
        gameRef.current.id = 'game';
        setupGameEventListeners();
        
        // 스크립트는 한 번만 로드
        const exist = Array.from(document.getElementsByTagName('script')).some(s => s.src.includes('/bundle.js'));
        if (!exist) {
        const gameScript = document.createElement('script');
        gameScript.src = '/bundle.js';
        gameScript.onload = () => {
            console.log('🎮 게임 스크립트 로드 완료');
            setIsGameLoaded(true);
                gameInstanceRef.current = false; // 아직 생성하지 않음
                console.log('🎮 스크립트만 로드 완료');
            };
            gameScript.onerror = () => { console.error('게임 로드 실패'); };
            gameRef.current.appendChild(gameScript);
        } else {
            setIsGameLoaded(true);
            gameInstanceRef.current = false;
        }
    };

    const createOrRestartGame = () => {
        if (!gameRef.current) return;
        // 기존 인스턴스 강제 종료 및 가드 해제
        if ((window as any).game) {
            try { (window as any).game.destroy(); } catch {}
            (window as any).game = null;
        }
        if ((window as any).__PITCHCRAFT_RESET) {
            try { (window as any).__PITCHCRAFT_RESET(); } catch {}
        } else {
            (window as any).__PITCHCRAFT_ACTIVE = false;
        }
        // 컨테이너 정리
        gameRef.current.innerHTML = '';
        gameRef.current.id = 'game';
        // 전역 팩토리 호출
        if ((window as any).createPitchCraft) {
            (window as any).createPitchCraft(gameRef.current);
            gameInstanceRef.current = true;
        } else {
            console.warn('createPitchCraft가 아직 준비되지 않음');
        }
    };

    const setupGameEventListeners = () => {
        console.log('🎮 게임 이벤트 리스너 설정 시작');
        
        // 기존 리스너 제거 (중복 방지)
        if ((window as any).gameOverHandler) {
            window.removeEventListener('gameOver', (window as any).gameOverHandler);
            document.removeEventListener('gameOver', (window as any).gameOverHandler);
        }
        
        // 커스텀 이벤트 리스너 등록
        const handleNextTestEvent = () => {
            console.log('🎮 다음 테스트 받기 이벤트 감지');
            handleRestart();
        };
        
        const handleRestartEvent = () => {
            console.log('🎮 다시하기 이벤트 감지');
            // 게임 오버 상태 초기화
            setGameOverProcessed(false);
            setShowVoiceRangeResult(false);
            setVoiceRangeData({});
            handleRestart();
        };
        
        const handleExitEvent = () => {
            console.log('🎮 그만하기 이벤트 감지');
            handleExit();
        };
        
        const handleGameOverEvent = (event: CustomEvent) => {
            console.log('🎮 ===== 게임 오버 이벤트 감지 시작 =====');
            console.log('🎮 이벤트 상세:', event.detail);
            console.log('🎮 이벤트 타입:', event.type);
            console.log('🎮 현재 상태:', { gameOverProcessed, showVoiceRangeResult });
            console.log('🎮 전역 변수:', { 
                isGameOver: (window as any).isGameOver,
                gameState: (window as any).gameState 
            });
            console.log('🎮 React 상태 업데이트 시작');
            
            if (gameOverProcessed || showVoiceRangeResult) {
                console.log('🎮 이미 게임 오버 처리가 완료됨 - 중복 처리 방지');
                return;
            }
            
            setGameOverProcessed(true);
            
            if ((window as any).game) {
                console.log('🎮 게임 인스턴스 정지 및 정리');
                (window as any).game.paused = true;
                (window as any).game.time.events.pause();
                (window as any).game.world.setBounds(0, 0, 0, 0);
            }
            
            (window as any).isGameOver = true;
            (window as any).gameState = { gameOver: true };
            
            // 사이드패널과 동일한 데이터 소스 사용
            const currentScores = (window as any).pitchScores || pitchScores || {};
            const totalScore = ((window as any).fighter && (window as any).fighter.score) || gameInfo.score || 0;
            
            console.log('🎮 음역대 점수 데이터(동일 소스):', currentScores);
            console.log('🎮 총점(동일 소스):', totalScore);
            
            const frequencies = Object.keys(currentScores).map(note => {
                const noteToFreq: { [key: string]: number } = {
                    'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50,
                    'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
                    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00,
                    'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
                    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
                    'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
                    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
                    'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
                    'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98,
                    'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00
                };
                return { note, frequency: noteToFreq[note] || 0, score: currentScores[note] };
            }).filter(item => item.frequency > 0);
            
            console.log('🎮 계산된 주파수 데이터:', frequencies);
            
            if (frequencies.length > 0) {
                const sortedFrequencies = frequencies.sort((a, b) => a.frequency - b.frequency);
                const lowest = sortedFrequencies[0];
                const highest = sortedFrequencies[sortedFrequencies.length - 1];
                
                console.log('🎮 최저/최고 음역대:', { lowest, highest });
                
                setVoiceRangeData({
                    highestNote: highest.note,
                    lowestNote: lowest.note,
                    highestFrequency: highest.frequency,
                    lowestFrequency: lowest.frequency,
                    totalScore: totalScore,
                });
            } else {
                console.log('🎮 음역대 데이터가 없어 기본값 사용');
                setVoiceRangeData({
                    highestNote: 'C5',
                    lowestNote: 'C3',
                    highestFrequency: 523.25,
                    lowestFrequency: 130.81,
                    totalScore: totalScore,
                });
            }
            
            console.log('🎮 음역대 결과 모달 표시 시작');
            setShowVoiceRangeResult(true);
            console.log('🎮 ===== 게임 오버 이벤트 처리 완료 =====');
        };
        
        // 전역 변수로 핸들러 저장 (중복 방지용)
        (window as any).gameOverHandler = handleGameOverEvent;
        
        // 이벤트 리스너 등록
        window.addEventListener('gameOver', handleGameOverEvent as EventListener);
        window.addEventListener('nextTest', handleNextTestEvent);
        window.addEventListener('restartGame', handleRestartEvent);
        window.addEventListener('exitGame', handleExitEvent);
        
        // 전역 함수 등록 (GameOver.ts에서 호출할 수 있도록)
        (window as any).onGameOver = handleGameOverEvent;
        
        console.log('🎮 게임 이벤트 리스너 등록 완료');
        console.log('🎮 등록된 전역 함수:', !!(window as any).onGameOver);
        console.log('🎮 등록된 핸들러:', !!(window as any).gameOverHandler);
        
        // 전역 이벤트 리스너도 추가 (확실하게)
        document.addEventListener('gameOver', handleGameOverEvent as EventListener);
        document.addEventListener('nextTest', handleNextTestEvent);
        document.addEventListener('restartGame', handleRestartEvent);
        document.addEventListener('exitGame', handleExitEvent);
        
        // 정리 함수 반환
        return () => {
            console.log('🎮 게임 이벤트 리스너 정리');
            window.removeEventListener('gameOver', handleGameOverEvent as EventListener);
            window.removeEventListener('nextTest', handleNextTestEvent);
            window.removeEventListener('restartGame', handleRestartEvent);
            window.removeEventListener('exitGame', handleExitEvent);
            
            document.removeEventListener('gameOver', handleGameOverEvent as EventListener);
            document.removeEventListener('nextTest', handleNextTestEvent);
            document.removeEventListener('restartGame', handleRestartEvent);
            document.removeEventListener('exitGame', handleExitEvent);
            
            // 전역 함수 제거
            (window as any).onGameOver = null;
            (window as any).gameOverHandler = null;
        };
    };
    


    useEffect(() => {
        // 전역 게임 오버 이벤트 리스너 추가 (확실하게)
        const globalGameOverHandler = (event: CustomEvent) => {
            console.log('🎮 전역 게임 오버 이벤트 감지:', event.detail);

            // 중복 처리 방지
            if (gameOverProcessed || showVoiceRangeResult) return;
            setGameOverProcessed(true);

            // 게임 일시정지
            if ((window as any).game) {
                (window as any).game.paused = true;
                (window as any).game.time.events.pause();
            }

            const detail = event.detail || {};
            const pitchScores = detail.pitchScores || {};
            const totalScore = detail.score || 0;

            // 음역대 계산
            const noteToFreq: { [key: string]: number } = {
                'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50,
                'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
                'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00,
                'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
                'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
                'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
                'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99,
                'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
                'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98,
                'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00
            };
            const freqList = Object.keys(pitchScores)
                .map(note => ({ note, frequency: noteToFreq[note] || 0 }))
                .filter(v => v.frequency > 0)
                .sort((a, b) => a.frequency - b.frequency);

            if (freqList.length > 0) {
                setVoiceRangeData({
                    highestNote: freqList[freqList.length - 1].note,
                    lowestNote: freqList[0].note,
                    highestFrequency: freqList[freqList.length - 1].frequency,
                    lowestFrequency: freqList[0].frequency,
                    totalScore
                });
            } else {
                setVoiceRangeData({
                    highestNote: 'C5',
                    lowestNote: 'C3',
                    highestFrequency: 523.25,
                    lowestFrequency: 130.81,
                    totalScore
                });
            }

            setShowVoiceRangeResult(true);
        };
        
        window.addEventListener('gameOver', globalGameOverHandler as EventListener);
        document.addEventListener('gameOver', globalGameOverHandler as EventListener);

        if (!gameRef.current) return;

        // 이미 게임이 로드되어 있는지 확인
        if (gameInstanceRef.current) {
            return () => {
                window.removeEventListener('gameOver', globalGameOverHandler as EventListener);
                document.removeEventListener('gameOver', globalGameOverHandler as EventListener);
            };
        }

        // 환경 변수 설정 (원본 게임과 동일)
        (window as any).process = {
            env: {
                WIDTH: 1080,
                HEIGHT: 768,
                NODE_ENV: 'production'
            }
        };

        // 기존 게임 인스턴스가 있는지 확인하고 정리
        const existingGame = document.getElementById('game');
        if (existingGame) {
            existingGame.innerHTML = '';
        }

        // 기존 Phaser 게임 인스턴스 정리
        if ((window as any).game) {
            try {
                (window as any).game.destroy();
    } catch (e) {
                console.log('기존 게임 정리 중 오류:', e);
            }
        }

        // Phaser가 이미 로드되어 있는지 확인
        if ((window as any).Phaser) {
            loadGameWithEventListeners();
        } else {
            // Phaser 라이브러리를 먼저 로드 (로컬에서)
            const phaserScript = document.createElement('script');
            phaserScript.src = '/assets/js/phaser.min.js';
            
            phaserScript.onload = () => {
                loadGameWithEventListeners();
            };
            
            phaserScript.onerror = () => {
                console.error('Phaser 로드 실패');
            };

            document.head.appendChild(phaserScript);
        }


        return () => {
            console.log('🎮 VoiceTestGame cleanup 시작');
            
            // 이벤트 리스너 정리
            const cleanup = setupGameEventListeners();
            if (cleanup) {
                cleanup();
            }
            
            // 전역 이벤트 리스너 정리
            const globalGameOverHandler = (event: CustomEvent) => {
                console.log('🎮 전역 게임 오버 이벤트 감지:', event.detail);
                // 게임 오버 시 바로 재시작
                handleRestart();
            };
            window.removeEventListener('gameOver', globalGameOverHandler as EventListener);
            document.removeEventListener('gameOver', globalGameOverHandler as EventListener);
            
            // 게임 인스턴스 정리
            gameInstanceRef.current = null;
            setIsGameLoaded(false);
            
            // 기존 게임 인스턴스 정리
            if ((window as any).game) {
                try {
                    (window as any).game.destroy();
                    (window as any).game = null;
                } catch (e) {
                    console.log('게임 정리 중 오류:', e);
                }
            }
            
            // 게임 컨테이너 정리
            if (gameRef.current) {
                gameRef.current.innerHTML = '';
            }
            
            console.log('🎮 VoiceTestGame cleanup 완료');
        };
    }, [showStartModal]);

    // 초기 로드 시 저장된 게임오버 결과 확인 로직 제거 (새로고침 시 모달 표시 안 함)

    // 모달 핸들러들
    const handleStartGame = () => {
        console.log('🎮 게임 시작');
        setShowStartModal(false);
        (window as any).isGameOver = false;
        (window as any).gameState = null;
        setGameOverProcessed(false);
        setShowVoiceRangeResult(false);
        setVoiceRangeData({});
        // 여기서만 실제 생성
        createOrRestartGame();
        console.log('🎮 게임 시작 완료');
    };

    const handlePause = () => {
        setIsGamePaused(true);
        setShowPauseModal(true);
        // 게임 일시정지 (Phaser 게임이 있다면)
        if ((window as any).game && (window as any).game.paused !== undefined) {
            (window as any).game.paused = true;
        }
    };

    const handleResume = () => {
        setIsGamePaused(false);
        setShowPauseModal(false);
        // 게임 재개 (Phaser 게임이 있다면)
        if ((window as any).game && (window as any).game.paused !== undefined) {
            (window as any).game.paused = false;
        }
    };

    const handleRestart = () => {
        if (gameRef.current) {
            gameRef.current.innerHTML = '';
        }
        createOrRestartGame();
    };

    // handleNextTest 함수 제거 (더 이상 사용하지 않음)

    const handleVoiceRangeResultClose = () => {
        setShowVoiceRangeResult(false);
        // 게임 재시작
        handleRestart();
    };

    const handleVoiceRangeResultContinue = () => {
        setShowVoiceRangeResult(false);
        // 녹음하기 페이지로 이동
        window.location.href = '/record';
    };


    // 선택 화면 관련 함수들 제거 (더 이상 사용하지 않음)

    const handleExit = () => {
        setShowExitModal(false);
        // 메인 페이지로 이동
        window.location.href = '/';
    };

    const handleExitConfirm = () => {
        setShowExitModal(false);
        handleExit();
    };

    const handleExitCancel = () => {
        setShowExitModal(false);
    };

  // 선택 화면 제거 - 바로 게임으로 진입


  return (
        <>
            <style>
                {`
                    /* 사이버펑크 애니메이션 */
                    @keyframes cyberGlow {
                        0% { opacity: 0.3; }
                        100% { opacity: 0.7; }
                    }
                    
                    @keyframes gridMove {
                        0% { transform: translate(0, 0); }
                        100% { transform: translate(50px, 50px); }
                    }

                    /* 피치 비주얼라이저 효과 - 더 극적인 모션 */
                    @keyframes equalize {
                        0%   { transform: scaleY(0.12); filter: drop-shadow(0 0 3px rgba(6,182,212,0.35)); }
                        45%  { transform: scaleY(1.25); filter: drop-shadow(0 0 14px rgba(236,72,153,0.85)); }
                        60%  { transform: scaleY(0.55); filter: drop-shadow(0 0 6px rgba(6,182,212,0.55)); }
                        80%  { transform: scaleY(1.10); filter: drop-shadow(0 0 12px rgba(236,72,153,0.75)); }
                        100% { transform: scaleY(0.12); filter: drop-shadow(0 0 3px rgba(6,182,212,0.35)); }
                    }
                    @keyframes pitchGlow {
                        0%,100% { opacity: 0.35; }
                        50% { opacity: 0.85; }
                    }
                    
                    @keyframes neonPulse {
                        0%, 100% { 
                            text-shadow: 0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88;
                        }
                        50% { 
                            text-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88;
                        }
                    }
                    
                    @keyframes coinSlotGlow {
                        0%, 100% { 
                            opacity: 0.5;
                            transform: translateY(-50%) scaleX(1);
                        }
                        50% { 
                            opacity: 1;
                            transform: translateY(-50%) scaleX(1.2);
                        }
                    }
                    
                    @keyframes coinPulse {
                        0%, 100% { 
                            transform: scale(1);
                            box-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
                        }
                        50% { 
                            transform: scale(1.2);
                            box-shadow: 0 0 20px rgba(0, 255, 136, 1);
                        }
                    }
                    
                    @keyframes micPulse {
                        0%, 100% { 
                            transform: scale(1);
                            box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
                        }
                        50% { 
                            transform: scale(1.05);
                            box-shadow: 0 0 30px rgba(0, 255, 136, 0.8);
                        }
                    }
                    
                    /* 게임 배경 이미지들 조정 - 잘림 방지 */
                    #game canvas {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: contain !important;
                    }
                    
                    /* 게임 내 모든 이미지들 - 잘림 방지 */
                    #game img,
                    #game canvas img,
                    #game * img,
                    #game div[style*="background"],
                    #game *[style*="background"] {
                        width: 100% !important;
                        height: 100% !important;
                        object-fit: contain !important;
                        object-position: center !important;
                    }
                    
                    /* 게임 화면 정리 - 깔끔한 레이아웃 */
                    #game {
                        position: relative !important;
                        overflow: hidden !important;
                        width: 100% !important;
                        height: 100% !important;
                    }
                    
                    /* 게임 내부 모든 요소들 */
                    #game * {
                        transform-origin: center center !important;
                    }
                    
                    /* Phaser 게임 스프라이트들 */
                    #game canvas + * {
                        transform: scale(1.0) !important;
                    }
                    
                    /* 게임 배경 레이어들 */
                    #game div[style*="position: absolute"],
                    #game div[style*="position:fixed"] {
                        width: 100% !important;
                        height: 100% !important;
                    }
                    
                    /* 게임 내 모든 div 요소들 */
                    #game div {
                        background-size: 100% 100% !important;
                        background-position: center !important;
                    }
                `}
            </style>
            <div style={{ 
                width: '100vw',
                height: '100vh',
                background: `
                    radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
                    radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
                    radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 80%),
                    radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
                    linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
                `,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                padding: '0 20px',
                gap: '20px'
            }}>
                {/* 그리드 패턴 */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `
                        linear-gradient(rgba(236, 72, 153, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px)
                    `,
                    backgroundSize: '50px 50px',
                    animation: 'gridMove 20s linear infinite'
                }} />

                {/* 좌측 게임 정보 영역 */}
                <div style={{
                    width: '300px',
                    height: '650px',
                    background: `
                        radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 60%),
                        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
                        linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
                    `,
                    borderRadius: '20px',
                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.3), 0 0 40px rgba(6, 182, 212, 0.3)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(20px)',
                    padding: '20px'
                }}>
                    {/* 제목 */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{
                            background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            margin: 0
                        }}>
                            🎮 게임 정보
                        </h3>
                    </div>

                    {/* 게임 정보 목록 */}
                        <div style={{
                        flex: 1,
                            display: 'flex',
                        flexDirection: 'column',
                            gap: '15px'
                        }}>
                        {/* 파일럿 정보 */}
                            <div style={{
                            background: 'rgba(236, 72, 153, 0.1)',
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                            borderRadius: '10px',
                            padding: '15px',
                                display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                            }}>
                                <div style={{
                                color: '#ec4899',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                                👨‍✈️ {gameInfo.pilotName}
                            </div>
                        </div>

                        {/* 점수 정보 */}
                        <div style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                                    borderRadius: '10px',
                            padding: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                                }}>
                                    <div style={{
                                color: '#06b6d4',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                                🏆 Score: {gameInfo.score.toLocaleString()}
                                </div>
                            </div>

                        {/* HP 정보 */}
                        <div style={{
                            background: 'rgba(236, 72, 153, 0.1)',
                            border: '1px solid rgba(236, 72, 153, 0.3)',
                            borderRadius: '10px',
                            padding: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                        }}>
                            <div style={{
                                color: '#ec4899',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                                ❤️ HP: {gameInfo.hp}
                            </div>
                            {/* HP 바 */}
                                <div style={{
                                width: '100%',
                                height: '8px',
                                background: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                                }}>
                                    <div style={{
                                    width: `${Math.max(0, Math.min(100, gameInfo.hp))}%`,
                                    height: '100%',
                                    background: gameInfo.hp > 50 
                                        ? 'linear-gradient(90deg, #06b6d4, #10b981)' 
                                        : gameInfo.hp > 25 
                                        ? 'linear-gradient(90deg, #f59e0b, #f97316)' 
                                        : 'linear-gradient(90deg, #ef4444, #dc2626)',
                                    transition: 'all 0.3s ease'
                                    }} />
                                </div>
                        </div>

                        {/* 피치 감지 정보 */}
                        <div style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '10px',
                            padding: '15px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* 네온 글로우 배경 */}
                                <div style={{
                                    position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(60% 60% at 50% 50%, rgba(6,182,212,0.15), transparent)',
                                filter: 'blur(12px)',
                                animation: 'pitchGlow 2s ease-in-out infinite'
                            }} />
                            <div style={{
                                color: '#06b6d4',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                zIndex: 1
                            }}>
                                🎵 {gameInfo.pitchStatus}
                            </div>

                            {/* 이퀄라이저 비주얼라이저 */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(16, 1fr)',
                                alignItems: 'end',
                                gap: '6px',
                                height: '72px',
                                padding: '6px 2px',
                                zIndex: 1
                            }}>
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div key={i} style={{
                                        height: `${12 + ((i * 7) % 18)}px`,
                                        background: 'linear-gradient(180deg, #22d3ee, #ec4899)',
                                        borderRadius: '4px',
                                        boxShadow: '0 0 16px rgba(6, 182, 212, 0.8), 0 0 8px rgba(236, 72, 153, 0.6) inset',
                                        filter: 'saturate(1.3) brightness(1.1)',
                                        opacity: 0.98,
                                        transformOrigin: 'bottom',
                                        willChange: 'transform, filter',
                                        animation: `equalize ${Math.max(0.5, Math.min(1.6, 1.4 - (gameInfo.targetY / 768))) }s cubic-bezier(0.2, 0.9, 0.1, 1) ${(i * 0.06).toFixed(2)}s infinite`,
                                    }} />
                                ))}
                        </div>

                            {/* 타깃 값 표시 */}
                            <div style={{
                                color: '#ffffff',
                                fontSize: '12px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                opacity: 0.8,
                                zIndex: 1
                            }}>
                                Target: {Math.round(gameInfo.targetY)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 게임기 모양의 컨테이너 */}
                <div style={{
                    width: '900px',
                    height: '650px',
                    background: `
                        radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 60%),
                        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
                        linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
                    `,
                    borderRadius: '20px',
                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.3), 0 0 40px rgba(6, 182, 212, 0.3)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(20px)',
                }}>
                    {/* 상단 패널 */}
                    <div style={{
                        height: '60px',
                        background: 'rgba(6, 182, 212, 0.1)',
                        borderTopLeftRadius: '19px',
                        borderTopRightRadius: '19px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 25px',
                        borderBottom: '1px solid rgba(6, 182, 212, 0.3)',
                        boxShadow: '0 2px 10px rgba(6, 182, 212, 0.2)',
                        position: 'relative',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {/* 장식용 코인 슬롯과 마이크 제거 - 기능이 없음 */}
                        
                        {/* 제목 */}
                        <div style={{
                            background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            letterSpacing: '1px'
                        }}>
                            PITCHCRAFT
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            {isGameLoaded && (
                                <>
                                    <button
                                        onClick={handlePause}
                                        style={{
                                            background: isGamePaused 
                                                ? 'linear-gradient(45deg, #06b6d4, #ec4899)' 
                                                : 'linear-gradient(45deg, #ec4899, #06b6d4)',
                                            color: '#000000',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)',
                                            marginRight: '10px',
                                            fontFamily: 'system-ui, -apple-system, sans-serif'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.1)';
                                            e.currentTarget.style.boxShadow = '0 0 25px rgba(236, 72, 153, 0.8)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.boxShadow = '0 0 15px rgba(236, 72, 153, 0.5)';
                                        }}
                                    >
                                        {isGamePaused ? '▶ RESUME' : '⏸ PAUSE'}
                                    </button>
                                    
                                </>
                            )}
            </div>
          </div>

                    {/* 게임 화면 영역 */}
                    <div style={{
                        flex: 1,
                        background: '#000000',
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        margin: '0 20px'
                    }}>
                        <div 
                            ref={gameRef} 
                            style={{
                                width: '900px', 
                                height: '600px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                overflow: 'hidden',
                                background: '#000000',
                                pointerEvents: showVoiceRangeResult ? 'none' : 'auto', // 모달이 표시되면 클릭 무시
                            }}
                            onClick={(e) => {
                                // 게임 오버 상태에서는 클릭 무시
                                if (showVoiceRangeResult || gameOverProcessed) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('🎮 게임 오버 상태 - 클릭 무시');
                                    return;
                                }
                            }}
                        />
                        
                        {!isGameLoaded && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: '#ffffff',
                                fontSize: '18px',
                                textAlign: 'center',
                                zIndex: 2
                            }}>
                                게임을 로딩 중입니다...
            </div>
          )}
        </div>

                    {/* 게임기 하단 부분 - 조이스틱과 버튼들 */}
                    <div style={{
                        height: '60px',
                        background: 'rgba(6, 182, 212, 0.1)',
                        borderBottomLeftRadius: '19px',
                        borderBottomRightRadius: '19px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 25px',
                        borderTop: '1px solid rgba(6, 182, 212, 0.3)',
                        flexShrink: 0,
                        boxShadow: '0 -2px 10px rgba(6, 182, 212, 0.2)',
                                position: 'relative',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {/* 장식용 버튼들 제거 - 기능이 없음 */}
                            </div>
                        </div>
                        
                {/* 우측 정보 영역 */}
                        <div style={{
                    width: '300px',
                    height: '650px',
                    marginLeft: '20px',
                    background: `
                        radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 60%),
                        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%),
                        linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
                    `,
                    borderRadius: '20px',
                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.3), 0 0 40px rgba(6, 182, 212, 0.3)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    backdropFilter: 'blur(20px)',
                    padding: '20px',
                            display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                        }}>
                    {/* 제목 */}
                            <div style={{
                        textAlign: 'center',
                        marginBottom: '20px'
                    }}>
                        <h3 style={{
                            background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '18px',
                                fontWeight: 'bold',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            margin: 0
                        }}>
                            🎵 음역대별 점수
                        </h3>
                            </div>

                    {/* 점수 목록 */}
                            <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px'
                    }}>
                        {Object.keys(pitchScores)
                            .filter(pitch => pitchScores[pitch] > 0)
                            .sort((a, b) => {
                                // 음역대별 주파수 기준으로 정렬 (높은 음역대부터)
                                const freqA = getPitchFrequency(a);
                                const freqB = getPitchFrequency(b);
                                return freqB - freqA;
                            })
                            .map((pitch, index) => (
                                <div key={pitch} style={{
                                    background: 'rgba(6, 182, 212, 0.1)',
                                    border: '1px solid rgba(6, 182, 212, 0.3)',
                                    borderRadius: '10px',
                                    padding: '12px',
                                    marginBottom: '8px',
                                display: 'flex',
                                    justifyContent: 'space-between',
                                alignItems: 'center',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <span style={{
                                color: '#ffffff',
                                        fontSize: '14px',
                                fontWeight: 'bold',
                                        fontFamily: 'system-ui, -apple-system, sans-serif'
                                    }}>
                                        {pitch}
                                    </span>
                                    <span style={{
                                        color: '#ec4899',
                                        fontSize: '14px',
                                fontWeight: 'bold',
                                        fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}>
                                        {pitchScores[pitch].toLocaleString()}점
                                    </span>
                            </div>
                            ))}
                        
                        {Object.keys(pitchScores).filter(pitch => pitchScores[pitch] > 0).length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                opacity: 0.6,
                                marginTop: '50px'
                            }}>
                                🎤 마이크로 음성을 내어<br />
                                음역대를 측정해보세요!
                            </div>
                        )}
        </div>
      </div>

            {/* 게임 시작 확인 모달 */}
            <GameStartModal
                isOpen={showStartModal}
                onClose={() => setShowStartModal(false)}
                onStartGame={handleStartGame}
            />

            {/* 게임 일시정지 모달 */}
            <GamePauseModal
                isOpen={showPauseModal}
                onClose={() => setShowPauseModal(false)}
                onResume={handleResume}
                onRestart={() => {
                    setShowPauseModal(false);
                    handleRestart();
                }}
                onExit={handleExit}
            />


            {/* 게임 종료 확인 모달 */}
            <GameExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirmExit={handleExitConfirm}
                onCancel={handleExitCancel}
            />

            {/* 음역대 결과 모달 */}
            <VoiceRangeResultModal
                isOpen={showVoiceRangeResult}
                onClose={handleVoiceRangeResultClose}
                onContinue={handleVoiceRangeResultContinue}
                highestNote={voiceRangeData.highestNote}
                lowestNote={voiceRangeData.lowestNote}
                highestFrequency={voiceRangeData.highestFrequency}
                lowestFrequency={voiceRangeData.lowestFrequency}
                totalScore={voiceRangeData.totalScore}
            />
    </div>
        </>
  );
};

export default VoiceTestGame;