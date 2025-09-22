import React from 'react';
import { Modal, Box } from '@mui/material';

interface GameStartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartGame: () => void;
}

const GameStartModal: React.FC<GameStartModalProps> = ({
    isOpen,
    onClose,
    onStartGame
}) => {
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
                    marginBottom: '20px',
                    fontSize: '28px',
                    fontWeight: 'bold'
                }}>
                    🎮 PitchCraft 게임 시작
                </h2>

                <div style={{
                    background: 'rgba(77, 208, 225, 0.1)',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '30px',
                    border: '1px solid rgba(77, 208, 225, 0.3)'
                }}>
                    <h3 style={{ color: '#4dd0e1', marginBottom: '15px', fontSize: '20px' }}>
                        게임 방법
                    </h3>
                    <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                        <p>🎤 <strong>마이크로 음성을 내어 전투기를 조종하세요!</strong></p>
                        <p>🔽 낮은 음 → 아래로 이동</p>
                        <p>🔼 높은 음 → 위로 이동</p>
                        <p>⭐ 노란 원을 먹어서 점수를 얻으세요</p>
                        <p>⚠️ 빨간 장애물을 피하세요</p>
                        <p>⏸️ 게임 중 일시정지 버튼으로 멈출 수 있습니다</p>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(255, 193, 7, 0.1)',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '30px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                }}>
                    <p style={{ color: '#ffc107', fontSize: '14px', margin: 0 }}>
                        ⚠️ 게임을 시작하시겠습니까? 마이크 권한이 필요합니다.
                    </p>
                </div>

                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'linear-gradient(45deg, #6c757d, #5a6268)',
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
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(108, 117, 125, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        취소
                    </button>

                    <button
                        onClick={onStartGame}
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
                        🎮 게임 시작
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

export default GameStartModal;
