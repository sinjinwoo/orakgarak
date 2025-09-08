import React from 'react';
import { Box, Typography } from '@mui/material';

const CoverSelector: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        커버 선택
      </Typography>
      <Typography variant="body2" color="text.secondary">
        AI 생성 또는 직접 업로드
      </Typography>
    </Box>
  );
};

export default CoverSelector;
