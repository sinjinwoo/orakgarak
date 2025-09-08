import React from 'react';
import { Box, Typography } from '@mui/material';

const ProfileEditor: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        프로필 편집
      </Typography>
      <Typography variant="body2" color="text.secondary">
        프로필 수정 (닉네임, 이미지)
      </Typography>
    </Box>
  );
};

export default ProfileEditor;
