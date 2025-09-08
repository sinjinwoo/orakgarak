import React from 'react';
import { Box, Typography } from '@mui/material';

const PitchGraph: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        피치 그래프
      </Typography>
      <Typography variant="body2" color="text.secondary">
        정확도/음정 시각화
      </Typography>
    </Box>
  );
};

export default PitchGraph;
