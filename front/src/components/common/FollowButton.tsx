import React, { useState, useEffect } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import { useFollow } from '../../hooks/useSocial';

interface FollowButtonProps {
  userId: number;
  initialIsFollowing?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'contained' | 'outlined' | 'text';
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  initialIsFollowing = false,
  size = 'medium',
  variant = 'contained',
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const { toggleFollow, isLoading, error } = useFollow();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleToggleFollow = async () => {
    const result = await toggleFollow(userId);
    if (result.success) {
      setIsFollowing(result.isFollowing);
      onFollowChange?.(result.isFollowing);
    }
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      size={size}
      variant={variant}
      startIcon={
        isLoading ? (
          <CircularProgress size={16} />
        ) : isFollowing ? (
          <PersonRemove />
        ) : (
          <PersonAdd />
        )
      }
      sx={{
        backgroundColor: isFollowing ? 'grey.500' : 'primary.main',
        '&:hover': {
          backgroundColor: isFollowing ? 'grey.600' : 'primary.dark',
        }
      }}
    >
      {isFollowing ? '언팔로우' : '팔로우'}
    </Button>
  );
};