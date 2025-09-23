import React from 'react';
import { Modal, Box } from '@mui/material';

interface GameResult {
    score: number;
    highestPitch: number;
    lowestPitch: number;
    playTime: number;
    level: number;
}

interface GameResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameResult: GameResult | null;
    onRestart: () => void;
    onNextTest: () => void;
    onExit: () => void;
}

const GameResultModal: React.FC<GameResultModalProps> = ({
    isOpen,
    onClose,
    gameResult,
    onRestart,
    onNextTest,
    onExit
}) => {
    if (!gameResult) return null;

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPitch = (pitch: number): string => {
        return `${pitch.toFixed(1)} Hz`;
    };

    return (
        <Modal 
            open={isOpen} 
            onClose={onClose}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Box sx={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                padding: '40px',
                borderRadius: '16px',
                border: '2px solid #4dd0e1',
                boxShadow: '0 0 30px rgba(77, 208, 225, 0.3)',
                maxWidth: '500px',
                width: '90%',
                textAlign: 'center',
                color: '#ffffff'
            }}>
                <h2 style={{
                    color: '#4dd0e1',
                    marginBottom: '30px',
                    fontSize: '28px',
                    fontWeight: 'bold'
                }}>
                    🎵 게임 결과 🎵
                </h2>

                <div style={{
                    background: 'rgba(77, 208, 225, 0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    border: '1px solid rgba(77, 208, 225, 0.3)'
                }}>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '18px', color: '#4dd0e1', marginBottom: '5px' }}>최종 점수</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
                            {gameResult.score.toLocaleString()}점
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: '#4dd0e1', marginBottom: '5px' }}>최고 피치</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {formatPitch(gameResult.highestPitch)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', color: '#4dd0e1', marginBottom: '5px' }}>최저 피치</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {formatPitch(gameResult.lowestPitch)}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: '#4dd0e1', marginBottom: '5px' }}>플레이 시간</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {formatTime(gameResult.playTime)}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '14px', color: '#4dd0e1', marginBottom: '5px' }}>달성 레벨</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                Level {gameResult.level}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={onRestart}
                        style={{
                            background: 'linear-gradient(45deg, #4dd0e1, #26c6da)',
                            color: '#0b1220',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minWidth: '120px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(77, 208, 225, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        🔄 다시하기
                    </button>

                    <button
                        onClick={onNextTest}
                        style={{
                            background: 'linear-gradient(45deg, #66bb6a, #4caf50)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minWidth: '120px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        🎵 다음 테스트
                    </button>

                    <button
                        onClick={onExit}
                        style={{
                            background: 'linear-gradient(45deg, #ef5350, #f44336)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            minWidth: '120px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(244, 67, 54, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        🚪 나가기
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

export default GameResultModal;
