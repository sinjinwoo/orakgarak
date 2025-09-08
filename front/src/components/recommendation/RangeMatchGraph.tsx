import React from 'react';
import { Box, Typography } from '@mui/material';

const RangeMatchGraph: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        음역대 매칭 그래프
      </Typography>
      <Typography variant="body2" color="text.secondary">
        내 음역대와 곡의 음역대 매칭 시각화
      </Typography>
    </Box>
  );
};

export default RangeMatchGraph;
