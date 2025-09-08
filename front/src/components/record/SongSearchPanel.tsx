import React from 'react';
import { Box, Typography } from '@mui/material';

const SongSearchPanel: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        곡 검색
      </Typography>
      <Typography variant="body2" color="text.secondary">
        노래를 검색하여 예약에 추가하세요.
      </Typography>
    </Box>
  );
};

export default SongSearchPanel;
