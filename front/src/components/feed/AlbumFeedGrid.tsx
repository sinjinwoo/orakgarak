import React from 'react';
import { Box, Typography } from '@mui/material';

const AlbumFeedGrid: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        앨범 피드 그리드
      </Typography>
      <Typography variant="body2" color="text.secondary">
        앨범 카드 그리드 레이아웃
      </Typography>
    </Box>
  );
};

export default AlbumFeedGrid;
