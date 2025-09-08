import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, LinearProgress } from '@mui/material';
import { useVocalRangeMeasurement } from '../../hooks/usePitch';

const VoiceRangeGame: React.FC = () => {
  const [gamePhase, setGamePhase] = useState<'ready' | 'low' | 'high' | 'complete'>('ready');
  const [currentNote, setCurrentNote] = useState('');
  const [progress, setProgress] = useState(0);
  
  const { isMeasuring, vocalRange, startMeasurement, stopMeasurement } = useVocalRangeMeasurement();

  const notes = ['도', '레', '미', '파', '솔', '라', '시'];

  useEffect(() => {
    if (gamePhase === 'low' || gamePhase === 'high') {
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 100));
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  const startLowRangeTest = () => {
    setGamePhase('low');
    setCurrentNote('가장 낮은 음으로 "아" 소리를 내세요');
    setProgress(0);
    startMeasurement();
  };

  const startHighRangeTest = () => {
    setGamePhase('high');
    setCurrentNote('가장 높은 음으로 "아" 소리를 내세요');
    setProgress(0);
  };

  const completeTest = () => {
    stopMeasurement();
    setGamePhase('complete');
  };

  return (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <Typography variant="h4" gutterBottom>
        음역대 측정 게임
      </Typography>
      
      {gamePhase === 'ready' && (
        <Box>
          <Typography variant="h6" gutterBottom>
            음역대를 측정해보세요!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            가장 낮은 음과 가장 높은 음을 발성하여<br />
            당신의 음역대를 측정합니다.
          </Typography>
          <Button variant="contained" size="large" onClick={startLowRangeTest}>
            측정 시작
          </Button>
        </Box>
      )}
      
      {(gamePhase === 'low' || gamePhase === 'high') && (
        <Box>
          <Typography variant="h5" gutterBottom>
            {currentNote}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mb: 3, height: 8 }}
          />
          <Typography variant="body1" color="text.secondary">
            {progress < 100 ? '계속 발성해주세요...' : '완료! 다음 단계로 진행하세요'}
          </Typography>
          {progress >= 100 && (
            <Box sx={{ mt: 2 }}>
              {gamePhase === 'low' ? (
                <Button variant="contained" onClick={startHighRangeTest}>
                  높은 음 측정하기
                </Button>
              ) : (
                <Button variant="contained" onClick={completeTest}>
                  측정 완료
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
      
      {gamePhase === 'complete' && vocalRange && (
        <Box>
          <Typography variant="h5" gutterBottom color="primary">
            측정 완료!
          </Typography>
          <Typography variant="h6" gutterBottom>
            당신의 음역대
          </Typography>
          <Typography variant="body1" color="text.secondary">
            최저음: {vocalRange.min.toFixed(1)} Hz<br />
            최고음: {vocalRange.max.toFixed(1)} Hz<br />
            음역대 폭: {(vocalRange.max - vocalRange.min).toFixed(1)} Hz
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VoiceRangeGame;
