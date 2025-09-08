import React from 'react';
import { Box, Typography } from '@mui/material';

const KaraokePlayer: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        노래방 플레이어
      </Typography>
      <Typography variant="body2" color="text.secondary">
        MR과 가사 싱크 재생
      </Typography>
    </Box>
  );
};

export default KaraokePlayer;
