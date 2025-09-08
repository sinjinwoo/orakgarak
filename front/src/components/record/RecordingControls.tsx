import React from 'react';
import { Box, Typography } from '@mui/material';

const RecordingControls: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        녹음 컨트롤
      </Typography>
      <Typography variant="body2" color="text.secondary">
        시작/정지/재녹음 버튼
      </Typography>
    </Box>
  );
};

export default RecordingControls;
