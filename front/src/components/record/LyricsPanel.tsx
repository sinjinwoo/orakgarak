import React from 'react';
import { Box, Typography } from '@mui/material';

const LyricsPanel: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        가사 패널
      </Typography>
      <Typography variant="body2" color="text.secondary">
        가사 하이라이트 표시
      </Typography>
    </Box>
  );
};

export default LyricsPanel;
