import React from 'react';
import { Box, Typography } from '@mui/material';

const ProfileHeader: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        프로필 헤더
      </Typography>
      <Typography variant="body2" color="text.secondary">
        프로필 사진/닉네임/팔로워·팔로잉
      </Typography>
    </Box>
  );
};

export default ProfileHeader;
