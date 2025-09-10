import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const OneLineRecorder: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', p: 4 }}>
      <Typography variant="h5" gutterBottom>
        한 줄 녹음
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        특정 구간을 녹음하여 음색을 분석합니다.
      </Typography>
      <Button variant="contained" size="large">
        녹음 시작
      </Button>
    </Box>
  );
};

export default OneLineRecorder;
