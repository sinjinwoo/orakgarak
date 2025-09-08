import React from 'react';
import { Box, Typography } from '@mui/material';

const AlbumMetaForm: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        앨범 정보 입력
      </Typography>
      <Typography variant="body2" color="text.secondary">
        제목, 태그, 공개범위, 소개글 입력
      </Typography>
    </Box>
  );
};

export default AlbumMetaForm;
