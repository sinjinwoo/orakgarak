import React from 'react';
import { Box, Typography } from '@mui/material';

const RecordingPicker: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        녹음 선택
      </Typography>
      <Typography variant="body2" color="text.secondary">
        내 녹음본을 선택하세요.
      </Typography>
    </Box>
  );
};

export default RecordingPicker;
