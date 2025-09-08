import React from 'react';
import { Skeleton, Box } from '@mui/material';

interface SkeletonBoxProps {
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
  count?: number;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  variant = 'rectangular',
  width = '100%',
  height = 20,
  animation = 'pulse',
  count = 1,
}) => {
  return (
    <Box>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          variant={variant}
          width={width}
          height={height}
          animation={animation}
          sx={{ mb: count > 1 ? 1 : 0 }}
        />
      ))}
    </Box>
  );
};

export default SkeletonBox;
