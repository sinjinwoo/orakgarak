import React from 'react';
import { Box, Typography } from '@mui/material';

const MyAlbumsGrid: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        내 앨범 그리드
      </Typography>
      <Typography variant="body2" color="text.secondary">
        내가 만든 앨범 모음
      </Typography>
    </Box>
  );
};

export default MyAlbumsGrid;
