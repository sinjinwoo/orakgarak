import React from 'react';
import { Box, Typography } from '@mui/material';

const FollowButton: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        팔로우 버튼
      </Typography>
      <Typography variant="body2" color="text.secondary">
        팔로우/언팔로우 기능
      </Typography>
    </Box>
  );
};

export default FollowButton;
