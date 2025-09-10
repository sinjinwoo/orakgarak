import React from 'react';
import { Box, Typography } from '@mui/material';

const AlbumFeedCard: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        앨범 피드 카드
      </Typography>
      <Typography variant="body2" color="text.secondary">
        피드에 표시되는 앨범 카드
      </Typography>
    </Box>
  );
};

export default AlbumFeedCard;
