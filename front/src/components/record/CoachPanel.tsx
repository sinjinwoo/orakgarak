import React from 'react';
import { Box, Typography } from '@mui/material';

const CoachPanel: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        코치 패널
      </Typography>
      <Typography variant="body2" color="text.secondary">
        AI 피치/박자/강세 코칭
      </Typography>
    </Box>
  );
};

export default CoachPanel;
