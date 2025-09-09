import React, { useRef, useEffect } from 'react';
import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import type { UserVocalRange, RecommendedSong } from '../../types/recommendation';

interface RangeMatchGraphProps {
  userRange: UserVocalRange;
  selectedSong?: RecommendedSong;
}

const RangeMatchGraph: React.FC<RangeMatchGraphProps> = ({ userRange, selectedSong }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 배경 그리기
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // 사용자 음역대 영역
    const userMinY = height - (userRange.min / 500) * height;
    const userMaxY = height - (userRange.max / 500) * height;
    const userComfortMinY = height - (userRange.comfortable.min / 500) * height;
    const userComfortMaxY = height - (userRange.comfortable.max / 500) * height;

    // 편안한 음역대 (연한 파란색)
    ctx.fillStyle = 'rgba(33, 150, 243, 0.2)';
    ctx.fillRect(0, userComfortMaxY, width, userComfortMinY - userComfortMaxY);

    // 전체 음역대 (연한 회색)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, userMaxY, width, userMinY - userMaxY);

    // 선택된 곡의 음역대
    if (selectedSong) {
      const songMinY = height - (selectedSong.vocalRange.min / 500) * height;
      const songMaxY = height - (selectedSong.vocalRange.max / 500) * height;

      // 곡 음역대 (빨간색)
      ctx.fillStyle = 'rgba(244, 67, 54, 0.3)';
      ctx.fillRect(0, songMaxY, width, songMinY - songMaxY);

      // 매칭 점수에 따른 색상
      const matchColor = selectedSong.matchScore >= 80 ? 'rgba(76, 175, 80, 0.6)' : 
                        selectedSong.matchScore >= 60 ? 'rgba(255, 152, 0, 0.6)' : 
                        'rgba(244, 67, 54, 0.6)';
      
      ctx.fillStyle = matchColor;
      ctx.fillRect(0, songMaxY, width, songMinY - songMaxY);
    }

    // 격자선 그리기
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 주파수 레이블
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i <= 5; i++) {
      const freq = 500 - (i * 100);
      const y = (height / 5) * i + 15;
      ctx.fillText(`${freq}Hz`, 5, y);
    }

  }, [userRange, selectedSong]);

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
        🎵 음역대 매칭 분석
      </Typography>
      
      {/* 사용자 음역대 정보 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          내 음역대: {userRange.min}Hz - {userRange.max}Hz
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          편안한 음역대: {userRange.comfortable.min}Hz - {userRange.comfortable.max}Hz
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(33, 150, 243, 0.3)', borderRadius: 1 }} />
            <Typography variant="caption">편안한 음역대</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 1 }} />
            <Typography variant="caption">전체 음역대</Typography>
          </Box>
        </Box>
      </Box>

      {/* 그래프 캔버스 */}
      <Box sx={{ mb: 2 }}>
        <canvas
          ref={canvasRef}
          width={300}
          height={200}
          style={{ width: '100%', height: '200px', border: '1px solid #e0e0e0', borderRadius: 4 }}
        />
      </Box>

      {/* 선택된 곡 정보 */}
      {selectedSong && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{selectedSong.title}</strong> - {selectedSong.artist}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            곡 음역대: {selectedSong.vocalRange.min}Hz - {selectedSong.vocalRange.max}Hz
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">매칭 점수:</Typography>
            <LinearProgress 
              variant="determinate" 
              value={selectedSong.matchScore} 
              sx={{ flex: 1, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" sx={{ minWidth: 40 }}>
              {selectedSong.matchScore}%
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default RangeMatchGraph;
