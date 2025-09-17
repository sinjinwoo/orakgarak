import React, { useEffect, useRef, useState } from 'react';
import GameExitModal from './GameExitModal';
import GameStartModal from './GameStartModal';
import GamePauseModal from './GamePauseModal';
import AirplaneRecordingTest from './AirplaneRecordingTest';
import VoiceTestSelection from './VoiceTestSelection';
import ExistingRecordingSelection from './ExistingRecordingSelection';

// 원본 PitchCraft 게임을 그대로 가져와서 통합
const VoiceTestGame: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const [isGameLoaded, setIsGameLoaded] = useState(false);
    const gameInstanceRef = useRef<any>(null);
    const [showStartModal, setShowStartModal] = useState(true);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [showAirplaneTest, setShowAirplaneTest] = useState(false);
    const [showVoiceTestSelection, setShowVoiceTestSelection] = useState(false);
    const [showExistingRecordingSelection, setShowExistingRecordingSelection] = useState(false);
    const [isGamePaused, setIsGamePaused] = useState(false);

    const loadGame = () => {
        if (!gameRef.current) return;
        
        // 게임 컨테이너에 ID 설정 (원본 게임이 찾는 ID)
        gameRef.current.id = 'game';
        
        // 게임 bundle.js 로드
        const gameScript = document.createElement('script');
        gameScript.src = '/bundle.js';
        gameScript.onload = () => {
            console.log('🎮 게임 스크립트 로드 완료');
            setIsGameLoaded(true);
            gameInstanceRef.current = true;
            
            // 게임 이벤트 리스너 설정
            setupGameEventListeners();
            
            console.log('🎮 게임 로드 완료, 이벤트 리스너 설정됨');
        };
        gameScript.onerror = () => {
            console.error('게임 로드 실패');
        };

        gameRef.current.appendChild(gameScript);
    };

    const setupGameEventListeners = () => {
        console.log('🎮 게임 이벤트 리스너 설정 시작');
        
        // 커스텀 이벤트 리스너 등록
        const handleNextTestEvent = () => {
            console.log('🎮 다음 테스트 받기 이벤트 감지');
            handleNextTest();
        };
        
        const handleRestartEvent = () => {
            console.log('🎮 다시하기 이벤트 감지');
            handleRestart();
        };
        
        const handleExitEvent = () => {
            console.log('🎮 그만하기 이벤트 감지');
            handleExit();
        };
        
        const handleGameOverEvent = (event: CustomEvent) => {
            console.log('🎮 게임 오버 이벤트 감지:', event.detail);
            
            // 게임 오버 상태 설정
            (window as any).isGameOver = true;
            (window as any).gameState = { gameOver: true };
            
            // 게임 오버 상태로 전환
            if ((window as any).game && (window as any).game.state) {
                console.log('🎮 GameOver 상태로 전환');
                (window as any).game.state.start('GameOver');
            } else {
                console.log('🎮 게임 인스턴스가 없음, 수동으로 모달 표시');
                // 게임이 없으면 수동으로 모달 표시
                setShowVoiceTestSelection(true);
            }
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('gameOver', handleGameOverEvent as EventListener);
        window.addEventListener('nextTest', handleNextTestEvent);
        window.addEventListener('restartGame', handleRestartEvent);
        window.addEventListener('exitGame', handleExitEvent);
        
        console.log('🎮 게임 이벤트 리스너 등록 완료');
        
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
        };
    };
    


    useEffect(() => {
        // 전역 게임 오버 이벤트 리스너 추가 (확실하게)
        const globalGameOverHandler = (event: CustomEvent) => {
            console.log('🎮 전역 게임 오버 이벤트 감지:', event.detail);
            setShowVoiceTestSelection(true);
        };
        
        window.addEventListener('gameOver', globalGameOverHandler as EventListener);
        document.addEventListener('gameOver', globalGameOverHandler as EventListener);
        
        // 게임 시작 모달이 열려있을 때는 게임을 로드하지 않음
        if (showStartModal) {
            return () => {
                window.removeEventListener('gameOver', globalGameOverHandler as EventListener);
                document.removeEventListener('gameOver', globalGameOverHandler as EventListener);
            };
        }

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
            loadGame();
        } else {
            // Phaser 라이브러리를 먼저 로드 (로컬에서)
            const phaserScript = document.createElement('script');
            phaserScript.src = '/assets/js/phaser.min.js';
            
            phaserScript.onload = () => {
                loadGame();
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
                setShowVoiceTestSelection(true);
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

    // 모달 핸들러들
    const handleStartGame = () => {
        console.log('🎮 게임 시작');
        setShowStartModal(false);
        // 게임 시작 시 게임 오버 상태 리셋
        (window as any).isGameOver = false;
        (window as any).gameState = null;
        
        // 게임 오버 이벤트 리스너 설정
        setupGameEventListeners();
        
        console.log('🎮 게임 시작 완료, 이벤트 리스너 설정됨');
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
        // 게임 컨테이너 정리
        if (gameRef.current) {
            gameRef.current.innerHTML = '';
        }
        
        // 기존 게임 인스턴스 정리
        if ((window as any).game) {
            try {
                (window as any).game.destroy();
            } catch (e) {
                console.log('게임 정리 중 오류:', e);
            }
        }
        
        // 게임 재시작
        gameInstanceRef.current = null;
        setIsGameLoaded(false);
        
        // 잠시 후 게임 다시 로드
        setTimeout(() => {
            if (gameRef.current) {
                loadGame();
            }
        }, 100);
    };

    const handleNextTest = () => {
        console.log('🎮 다음 테스트 받기 버튼 클릭');
        setShowVoiceTestSelection(true);
    };

    const handleAirplaneTestComplete = (audioBlob: Blob) => {
        console.log('비행기 테스트 완료:', audioBlob);
        // 테스트 완료 후 추천 페이지로 이동
        window.location.href = '/recommendations';
    };

    const handleBackToGame = () => {
        setShowAirplaneTest(false);
        setShowVoiceTestSelection(false);
        setShowExistingRecordingSelection(false);
    };

    const handleNewRecording = () => {
        setShowVoiceTestSelection(false);
        setShowAirplaneTest(true);
    };

    const handleUseExistingRecording = (audioBlob: Blob) => {
        console.log('🎵 VoiceTestGame: 기존 녹음본 사용 함수 호출됨', audioBlob);
        setShowVoiceTestSelection(false);
        setShowExistingRecordingSelection(true);
        console.log('🎵 VoiceTestGame: 상태 변경 완료 - showVoiceTestSelection: false, showExistingRecordingSelection: true');
    };

    const handleSelectExistingRecording = (audioBlob: Blob) => {
        console.log('기존 녹음본 선택:', audioBlob);
        setShowExistingRecordingSelection(false);
        // 기존 녹음본으로 바로 추천 페이지로 이동
        window.location.href = '/recommendations';
    };

    const handleBackFromExistingSelection = () => {
        setShowExistingRecordingSelection(false);
        setShowVoiceTestSelection(true);
    };

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

  // 기존 녹음본 선택 화면 표시
  if (showExistingRecordingSelection) {
    return (
      <ExistingRecordingSelection
        onSelectRecording={handleSelectExistingRecording}
        onBack={handleBackFromExistingSelection}
      />
    );
  }

  // 음성 테스트 선택 화면 표시
  if (showVoiceTestSelection) {
    return (
      <VoiceTestSelection
        onNewRecording={handleNewRecording}
        onUseExisting={handleUseExistingRecording}
        onBack={handleBackToGame}
      />
    );
  }

  // 비행기 테스트 화면 표시
  if (showAirplaneTest) {
    return (
      <AirplaneRecordingTest
        onComplete={handleAirplaneTestComplete}
        onBack={handleBackToGame}
      />
    );
  }

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
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* 사이버펑크 배경 효과 */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `
                        radial-gradient(circle at 20% 80%, rgba(0, 255, 136, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 0, 68, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(0, 255, 255, 0.05) 0%, transparent 50%)
                    `,
                    animation: 'cyberGlow 4s ease-in-out infinite alternate'
                }} />

                {/* 네온 그리드 배경 */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundImage: `
                        linear-gradient(rgba(0, 255, 136, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 255, 136, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                    animation: 'gridMove 20s linear infinite'
                }} />

                {/* 레트로 게임기 모양의 모달 */}
                <div style={{
                    width: '900px',
                    height: '650px',
                    background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
                    borderRadius: '25px',
                    boxShadow: '0 0 40px rgba(0, 255, 136, 0.3), inset 0 0 40px rgba(0, 255, 136, 0.05)',
                    border: '3px solid #00ff88',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(5px)',
                    // 레트로 게임기 느낌을 위한 추가 스타일
                    transform: 'perspective(800px) rotateX(3deg)',
                    transformStyle: 'preserve-3d'
                }}>
                    {/* 상단 패널 */}
                    <div style={{
                        height: '60px',
                        background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                        borderTopLeftRadius: '22px',
                        borderTopRightRadius: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 25px',
                        borderBottom: '2px solid #00ff88',
                        boxShadow: '0 2px 10px rgba(0, 255, 136, 0.2)',
                        position: 'relative'
                    }}>
                        {/* 코인 슬롯 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '30px',
                                background: 'linear-gradient(145deg, #0a0a0a, #000000)',
                                borderRadius: '15px',
                                border: '2px solid #00ff88',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.9)'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '20px',
                                    background: 'linear-gradient(90deg, #222, #444, #222)',
                                    borderRadius: '10px',
                                    border: '1px solid #555',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '8px',
                                        transform: 'translateY(-50%)',
                                        width: '24px',
                                        height: '1px',
                                        background: 'linear-gradient(90deg, #00ff88, #00ffff)',
                                        borderRadius: '1px',
                                        animation: 'coinSlotGlow 2s ease-in-out infinite'
                                    }} />
                                </div>
                                <div style={{
                                    position: 'absolute',
                                    top: '-3px',
                                    right: '-3px',
                                    width: '10px',
                                    height: '10px',
                                    background: 'radial-gradient(circle, #00ff88, #00aa55)',
                                    borderRadius: '50%',
                                    boxShadow: '0 0 8px rgba(0, 255, 136, 0.8)',
                                    animation: 'coinPulse 1.5s ease-in-out infinite'
                                }} />
                            </div>
                        </div>
                        {/* 마이크 부분 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(145deg, #0a0a0a, #000000)',
                                borderRadius: '50%',
                                border: '2px solid #00ff88',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                boxShadow: '0 0 15px rgba(0, 255, 136, 0.4)',
                                animation: 'micPulse 2s ease-in-out infinite'
                            }}>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    background: 'radial-gradient(circle, #00ff88, #00aa55)',
                                    borderRadius: '50%',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '6px',
                                        height: '6px',
                                        background: '#ffffff',
                                        borderRadius: '50%',
                                        boxShadow: '0 0 3px rgba(255, 255, 255, 0.8)'
                                    }} />
                                </div>
                                {/* 마이크 그리드 패턴 */}
                                <div style={{
                                    position: 'absolute',
                                    top: '3px',
                                    left: '3px',
                                    right: '3px',
                                    bottom: '3px',
                                    background: `
                                        radial-gradient(circle at 30% 30%, rgba(0, 255, 136, 0.2) 1px, transparent 1px),
                                        radial-gradient(circle at 70% 70%, rgba(0, 255, 136, 0.2) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '6px 6px',
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }} />
                            </div>
                        </div>
                        
                        {/* 제목 */}
                        <div style={{
                            color: '#00ff88',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            textShadow: '0 0 10px rgba(0, 255, 136, 0.8)',
                            background: 'linear-gradient(45deg, #00ff88, #00ffff)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '1px'
                        }}>
                            PITCHCRAFT
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            {isGameLoaded && !isGamePaused && (
                                <>
                                    <button
                                        onClick={handlePause}
                                        style={{
                                            background: 'linear-gradient(45deg, #ff9800, #f57c00)',
                                            color: '#ffffff',
                                            border: '2px solid #ff9800',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 0 15px rgba(255, 152, 0, 0.5)',
                                            marginRight: '10px'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.4)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.3)';
                                        }}
                                    >
                                        ⏸️ PAUSE
                                    </button>
                                    
                                    {/* 테스트 종료 버튼 */}
                                    <button
                                        onClick={() => {
                                            console.log('🎮 테스트 종료 버튼 클릭');
                                            
                                            // 게임이 실행 중이면 GameOver 상태로 전환
                                            if ((window as any).game && (window as any).game.state) {
                                                console.log('🎮 게임 상태를 GameOver로 전환');
                                                (window as any).game.state.start('GameOver');
                                            } else {
                                                console.log('🎮 게임이 없으므로 직접 선택 화면 표시');
                                                setShowVoiceTestSelection(true);
                                            }
                                            
                                            // 추가로 이벤트도 발생
                                            const gameOverEvent = new CustomEvent('gameOver', {
                                                detail: {
                                                    score: 5000,
                                                    hitpoints: 0,
                                                    pitchScores: { 'C4': 1000, 'D4': 2000, 'E4': 1500 }
                                                }
                                            });
                                            window.dispatchEvent(gameOverEvent);
                                        }}
                                        style={{
                                            background: 'linear-gradient(45deg, #ff4444, #cc0000)',
                                            color: '#ffffff',
                                            border: '2px solid #ff4444',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 0 15px rgba(255, 68, 68, 0.5)'
                                        }}
                                        onClick={() => {
                                            console.log('🎮 TEST END 버튼 클릭');
                                            // 게임 오버 이벤트 강제 발생
                                            const gameOverEvent = new CustomEvent('gameOver', {
                                                detail: {
                                                    score: 1000,
                                                    hitpoints: 0,
                                                    pitchScores: {}
                                                }
                                            });
                                            window.dispatchEvent(gameOverEvent);
                                            document.dispatchEvent(gameOverEvent);
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 68, 68, 0.4)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 68, 68, 0.3)';
                                        }}
                                    >
                                        🎮 TEST END
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
                                background: '#000000'
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
                        background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                        borderBottomLeftRadius: '22px',
                        borderBottomRightRadius: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 25px',
                        borderTop: '2px solid #00ff88',
                        flexShrink: 0,
                        boxShadow: '0 -2px 10px rgba(0, 255, 136, 0.2)',
                        position: 'relative'
                    }}>
                        {/* 조이스틱 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: 'linear-gradient(145deg, #0a0a0a, #000000)',
                                borderRadius: '50%',
                                border: '3px solid #00ff88',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)'
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: 'radial-gradient(circle, #00ff88, #00aa55)',
                                    borderRadius: '50%',
                                    position: 'relative',
                                    boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.5)'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '16px',
                                        height: '16px',
                                        background: 'linear-gradient(45deg, #ffffff, #cccccc)',
                                        borderRadius: '50%',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                                    }} />
                                </div>
                                {/* 조이스틱 그리드 */}
                                <div style={{
                                    position: 'absolute',
                                    top: '3px',
                                    left: '3px',
                                    right: '3px',
                                    bottom: '3px',
                                    background: `
                                        linear-gradient(0deg, rgba(0, 255, 136, 0.15) 1px, transparent 1px),
                                        linear-gradient(90deg, rgba(0, 255, 136, 0.15) 1px, transparent 1px)
                                    `,
                                    backgroundSize: '8px 8px',
                                    borderRadius: '50%',
                                    pointerEvents: 'none'
                                }} />
                            </div>
                        </div>
                        
                        {/* 액션 버튼들 */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                width: '35px',
                                height: '35px',
                                borderRadius: '50%',
                                background: 'linear-gradient(145deg, #ff4444, #cc0000)',
                                border: '2px solid #ff6666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                boxShadow: '0 0 12px rgba(255, 68, 68, 0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.8)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 68, 68, 0.5)';
                            }}
                            >
                                A
                            </div>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                                border: '2px solid #555',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
                            }}>
                                B
                            </div>
                            <div style={{
                                width: '45px',
                                height: '22px',
                                borderRadius: '11px',
                                background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                                border: '2px solid #555',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '7px',
                                fontWeight: 'bold',
                                boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
                            }}>
                                START
                            </div>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                                border: '2px solid #555',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
                            }}>
                                X
                            </div>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                                border: '2px solid #555',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                boxShadow: '0 0 8px rgba(0, 0, 0, 0.3)'
                            }}>
                                Y
                            </div>
          </div>
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
                onExit={handleExit}
            />


            {/* 게임 종료 확인 모달 */}
            <GameExitModal
                isOpen={showExitModal}
                onClose={() => setShowExitModal(false)}
                onConfirmExit={handleExitConfirm}
                onCancel={handleExitCancel}
            />
    </div>
        </>
  );
};

export default VoiceTestGame;