import React from 'react';
import { Box, Typography } from '@mui/material';

const MyAICoverGallery: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        내 AI 커버 갤러리
      </Typography>
      <Typography variant="body2" color="text.secondary">
        생성한 AI 커버 모음
      </Typography>
    </Box>
  );
};

export default MyAICoverGallery;
