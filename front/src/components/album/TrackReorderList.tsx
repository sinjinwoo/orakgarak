import React from 'react';
import { Box, Typography } from '@mui/material';

const TrackReorderList: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        트랙 순서 조정
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Drag & Drop으로 트랙 정렬
      </Typography>
    </Box>
  );
};

export default TrackReorderList;
