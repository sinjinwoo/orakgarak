import React from 'react';
import { Box, Typography } from '@mui/material';

const CommentDrawer: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        댓글 드로어
      </Typography>
      <Typography variant="body2" color="text.secondary">
        댓글/대댓글 보기 & 작성
      </Typography>
    </Box>
  );
};

export default CommentDrawer;
