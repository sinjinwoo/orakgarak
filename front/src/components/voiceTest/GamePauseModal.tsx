import React from 'react';
import Modal from '../common/Modal';

interface GamePauseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResume: () => void;
    onExit: () => void;
}

const GamePauseModal: React.FC<GamePauseModalProps> = ({
    isOpen,
    onClose,
    onResume,
    onExit
}) => {
    return (
        <Modal open={isOpen} onClose={onClose}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
                padding: '40px',
                borderRadius: '16px',
                border: '2px solid #4dd0e1',
                boxShadow: '0 0 30px rgba(77, 208, 225, 0.3)',
                maxWidth: '400px',
                width: '90%',
                textAlign: 'center',
                color: '#ffffff'
            }}>
                <h2 style={{
                    color: '#4dd0e1',
                    marginBottom: '20px',
                    fontSize: '24px',
                    fontWeight: 'bold'
                }}>
                    ⏸️ 게임 일시정지
                </h2>

                <p style={{
                    fontSize: '16px',
                    marginBottom: '30px',
                    lineHeight: '1.5',
                    color: '#cccccc'
                }}>
                    게임이 일시정지되었습니다.<br />
                    계속하시겠습니까?
                </p>

                <div style={{
                    display: 'flex',
                    gap: '15px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={onResume}
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
                            minWidth: '100px'
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
                        ▶️ 이어하기
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
                            minWidth: '100px'
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
                        🚪 그만하기
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GamePauseModal;
