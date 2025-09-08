import React from 'react';
import { Box, Typography } from '@mui/material';

const MyRecordingsTable: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        내 녹음 테이블
      </Typography>
      <Typography variant="body2" color="text.secondary">
        녹음 기록 관리
      </Typography>
    </Box>
  );
};

export default MyRecordingsTable;
