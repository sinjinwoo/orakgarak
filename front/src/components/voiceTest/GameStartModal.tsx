import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { MusicNote, Mic, TrendingUp, TrendingDown, PlayArrow, Close } from '@mui/icons-material';

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
                backdropFilter: 'blur(10px)',
            }}
        >
            <Box sx={{
                position: 'relative',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '15px',
                boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
                maxWidth: '600px',
                width: '90%',
                textAlign: 'center',
                color: '#ffffff',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                        radial-gradient(circle at 20% 20%, rgba(251, 66, 212, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(66, 253, 235, 0.1) 0%, transparent 50%)
                    `,
                    zIndex: 0,
                }
            }}>
                <Box sx={{ position: 'relative', zIndex: 1, p: 4 }}>
                    {/* 헤더 */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2
                        }}>
                            <MusicNote sx={{ 
                                fontSize: 48, 
                                color: '#00ffff', 
                                mr: 2,
                                filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))'
                            }} />
                            <Typography
                                variant="h3"
                                sx={{
                                    background: 'linear-gradient(45deg, #00ffff, #ff00ff)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 'bold',
                                    fontFamily: 'monospace',
                                    textShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
                                    margin: '0 0 10px 0'
                                }}
                            >
                                음역대 테스트
                            </Typography>
                        </Box>
                        
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#00ffff',
                                fontSize: '1rem',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                fontFamily: 'monospace',
                                opacity: 0.9
                            }}
                        >
                            나의 음역대를 측정해보세요
                        </Typography>
                    </Box>

                    {/* 게임 설명 */}
                    <Box sx={{
                        background: 'rgba(0, 255, 255, 0.05)',
                        border: '1px solid rgba(0, 255, 255, 0.2)',
                        borderRadius: '15px',
                        p: 3,
                        mb: 3,
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Typography
                            variant="h5"
                            sx={{
                                color: '#00ffff',
                                fontWeight: 'bold',
                                mb: 2,
                                textShadow: '0 0 15px rgba(0, 255, 255, 0.8)',
                                fontFamily: 'monospace'
                            }}
                        >
                            🎯 게임 방법
                        </Typography>
                        
                        <Box sx={{ textAlign: 'left', lineHeight: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <Mic sx={{ color: '#FB42D4', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(251, 66, 212, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                                    <strong>마이크로 음성을 내어 음역대를 측정하세요!</strong>
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <TrendingDown sx={{ color: '#ff0080', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(255, 0, 128, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                                    낮은 음 → 최저 음역대 측정
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <TrendingUp sx={{ color: '#00ff88', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(0, 255, 136, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                                    높은 음 → 최고 음역대 측정
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <MusicNote sx={{ color: '#ffff00', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(255, 255, 0, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'monospace' }}>
                                    다양한 음계를 연습해보세요
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* 주의사항 */}
                    <Box sx={{
                        background: 'rgba(255, 0, 128, 0.1)',
                        border: '1px solid rgba(255, 0, 128, 0.3)',
                        borderRadius: '12px',
                        p: 2,
                        mb: 4,
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Typography
                            sx={{
                                color: '#ff0080',
                                fontSize: '14px',
                                fontFamily: 'monospace',
                                textShadow: '0 0 10px rgba(255, 0, 128, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            ⚠️ 마이크 권한이 필요합니다. 조용한 환경에서 진행해주세요.
                        </Typography>
                    </Box>

                    {/* 버튼들 */}
                    <Box sx={{
                        display: 'flex',
                        gap: 3,
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            startIcon={<Close />}
                            sx={{
                                borderColor: 'rgba(0, 255, 255, 0.5)',
                                color: '#00ffff',
                                px: 4,
                                py: 1.5,
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontFamily: 'monospace',
                                textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
                                '&:hover': {
                                    background: 'rgba(0, 255, 255, 0.1)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 20px rgba(0, 255, 255, 0.4)',
                                    borderColor: '#00ffff',
                                },
                            }}
                        >
                            취소
                        </Button>

                        <Button
                            variant="contained"
                            onClick={onStartGame}
                            startIcon={<PlayArrow />}
                            sx={{
                                background: 'linear-gradient(45deg, #ff00ff, #00ffff)',
                                color: '#000000',
                                px: 4,
                                py: 1.5,
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontFamily: 'monospace',
                                boxShadow: '0 4px 20px rgba(255, 0, 255, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #ff33ff, #33ffff)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 25px rgba(255, 0, 255, 0.4)',
                                },
                            }}
                        >
                            🎮 게임 시작
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default GameStartModal;
