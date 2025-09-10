import React from 'react';
import { Box, Typography } from '@mui/material';

const AlbumPreview: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        앨범 미리보기
      </Typography>
      <Typography variant="body2" color="text.secondary">
        앨범 커버 + 트랙 리스트 미리보기
      </Typography>
    </Box>
  );
};

export default AlbumPreview;
