import React from 'react';
import { Box, Typography } from '@mui/material';

const VolumeVisualizer: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        볼륨 시각화
      </Typography>
      <Typography variant="body2" color="text.secondary">
        실시간 볼륨 파형 표시
      </Typography>
    </Box>
  );
};

export default VolumeVisualizer;
