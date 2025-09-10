import React from 'react';
import { Box, Typography } from '@mui/material';

const MyStats: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        내 통계
      </Typography>
      <Typography variant="body2" color="text.secondary">
        활동 현황 (좋아요 수, 녹음 수, 앨범 수 등)
      </Typography>
    </Box>
  );
};

export default MyStats;
