import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  message = '로딩 중...',
  fullScreen = false,
}) => {
  const content = (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingSpinner;
