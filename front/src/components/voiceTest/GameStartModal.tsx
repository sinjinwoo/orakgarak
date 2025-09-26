import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { MusicNote, Mic, TrendingUp, TrendingDown, PlayArrow, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';

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
            onClose={() => { /* 외부 클릭/ESC 무시 */ }}
            disableEscapeKeyDown
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            >
                <Box sx={{
                    position: 'relative',
                    background: `
                        radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
                        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
                        linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
                    `,
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '20px',
                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.3), 0 0 40px rgba(6, 182, 212, 0.3)',
                    maxWidth: '600px',
                    width: '90%',
                    textAlign: 'center',
                    color: '#ffffff',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden',
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
                                color: '#ec4899', 
                                mr: 2,
                                filter: 'drop-shadow(0 0 10px rgba(236, 72, 153, 0.8))'
                            }} />
                            <Typography
                                variant="h3"
                                sx={{
                                    background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 'bold',
                                    fontFamily: 'system-ui, -apple-system, sans-serif',
                                    textShadow: '0 0 20px rgba(236, 72, 153, 0.5)',
                                    margin: '0 0 10px 0'
                                }}
                            >
                                음역대 테스트
                            </Typography>
                        </Box>
                        
                        <Typography
                            variant="h6"
                            sx={{
                                color: '#06b6d4',
                                fontSize: '1rem',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                opacity: 0.9
                            }}
                        >
                            나의 음역대를 측정해보세요
                        </Typography>
                    </Box>

                    {/* 게임 설명 */}
                    <Box sx={{
                        background: 'rgba(6, 182, 212, 0.1)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        borderRadius: '15px',
                        p: 3,
                        mb: 3,
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Typography
                            variant="h5"
                            sx={{
                                color: '#06b6d4',
                                fontWeight: 'bold',
                                mb: 2,
                                textShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
                                fontFamily: 'system-ui, -apple-system, sans-serif'
                            }}
                        >
                         게임 방법
                        </Typography>
                        
                        <Box sx={{ textAlign: 'left', lineHeight: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <Mic sx={{ color: '#ec4899', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    <strong>마이크로 음성을 내어 음역대를 측정하세요!</strong>
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <TrendingDown sx={{ color: '#ec4899', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    낮은 음 → 최저 음역대 측정
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <TrendingUp sx={{ color: '#06b6d4', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(6, 182, 212, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    높은 음 → 최고 음역대 측정
                                </Typography>
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <MusicNote sx={{ color: '#ec4899', mr: 1.5, fontSize: 20, filter: 'drop-shadow(0 0 5px rgba(236, 72, 153, 0.8))' }} />
                                <Typography sx={{ color: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                                    다양한 음계를 연습해보세요
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* 주의사항 */}
                    <Box sx={{
                        background: 'rgba(236, 72, 153, 0.1)',
                        border: '1px solid rgba(236, 72, 153, 0.3)',
                        borderRadius: '12px',
                        p: 2,
                        mb: 4,
                        backdropFilter: 'blur(10px)',
                    }}>
                        <Typography
                            sx={{
                                color: '#ec4899',
                                fontSize: '14px',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                textShadow: '0 0 10px rgba(236, 72, 153, 0.6)',
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
                            variant="contained"
                            onClick={onStartGame}
                            startIcon={<PlayArrow />}
                            sx={{
                                background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                                color: '#000000',
                                px: 4,
                                py: 1.5,
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.6)',
                                },
                            }}
                        >
                            🎮 게임 시작
                        </Button>
                    </Box>
                </Box>
            </Box>
            </motion.div>
        </Modal>
    );
};

export default GameStartModal;
