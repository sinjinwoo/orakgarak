import React from 'react';
import { Box, Typography } from '@mui/material';

const ReservationQueue: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        예약 큐
      </Typography>
      <Typography variant="body2" color="text.secondary">
        예약된 곡들의 목록입니다.
      </Typography>
    </Box>
  );
};

export default ReservationQueue;
