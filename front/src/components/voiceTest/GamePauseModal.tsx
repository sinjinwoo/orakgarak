import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';
import { motion } from 'framer-motion';
import { PlayArrow, ExitToApp, Refresh } from '@mui/icons-material';

interface GamePauseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResume: () => void;
    onRestart: () => void;
    onExit: () => void;
}

const GamePauseModal: React.FC<GamePauseModalProps> = ({
    isOpen,
    onClose,
    onResume,
    onRestart,
    onExit
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
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center',
                    color: '#ffffff',
                    backdropFilter: 'blur(20px)',
                    overflow: 'hidden',
                    p: 4
                }}>
                    <Typography
                        variant="h4"
                        sx={{
                            background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            mb: 3
                        }}
                    >
                        ⏸️ 게임 일시정지
                    </Typography>

                    <Typography
                        variant="h6"
                        sx={{
                            color: '#ffffff',
                            fontSize: '16px',
                            mb: 4,
                            lineHeight: 1.5,
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                        }}
                    >
                        게임이 일시정지되었습니다.<br />
                        계속하시겠습니까?
                    </Typography>

                    <Box sx={{
                        display: 'flex',
                        gap: 2,
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            variant="contained"
                            onClick={onResume}
                            startIcon={<PlayArrow />}
                            sx={{
                                background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                                color: '#000000',
                                px: 3,
                                py: 1.5,
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 0 40px rgba(6, 182, 212, 0.6)',
                                },
                            }}
                        >
                            이어하기
                        </Button>

                        <Button
                            variant="contained"
                            onClick={onRestart}
                            startIcon={<Refresh />}
                            sx={{
                                background: 'linear-gradient(45deg, #ec4899, #06b6d4)',
                                color: '#000000',
                                px: 3,
                                py: 1.5,
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #06b6d4, #ec4899)',
                                    transform: 'scale(1.1)',
                                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.6)',
                                },
                            }}
                        >
                            다시하기
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={onExit}
                            startIcon={<ExitToApp />}
                            sx={{
                                borderColor: 'rgba(236, 72, 153, 0.5)',
                                color: '#ec4899',
                                px: 3,
                                py: 1.5,
                                borderRadius: '25px',
                                fontWeight: 'bold',
                                textTransform: 'none',
                                fontSize: '0.9rem',
                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                textShadow: '0 0 10px rgba(236, 72, 153, 0.8)',
                                boxShadow: '0 0 15px rgba(236, 72, 153, 0.3)',
                                '&:hover': {
                                    background: 'rgba(236, 72, 153, 0.1)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
                                    borderColor: '#ec4899',
                                },
                            }}
                        >
                            그만하기
                        </Button>
                    </Box>
                </Box>
            </motion.div>
        </Modal>
    );
};

export default GamePauseModal;
