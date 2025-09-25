import React, { useState, useEffect } from 'react';
import { IconButton, CircularProgress } from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useAlbumLike } from '../../hooks/useSocial';

interface LikeButtonProps {
  albumId: number;
  initialIsLiked?: boolean;
  size?: 'small' | 'medium' | 'large';
  onLikeChange?: (isLiked: boolean) => void;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  albumId,
  initialIsLiked = false,
  size = 'medium',
  onLikeChange
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const { toggleLike, isLoading, error } = useAlbumLike();

  useEffect(() => {
    setIsLiked(initialIsLiked);
  }, [initialIsLiked]);

  const handleToggleLike = async () => {
    const result = await toggleLike(albumId);
    if (result.success) {
      setIsLiked(result.isLiked);
      onLikeChange?.(result.isLiked);
    }
  };

  return (
    <IconButton
      onClick={handleToggleLike}
      disabled={isLoading}
      size={size}
      sx={{
        color: isLiked ? 'error.main' : 'action.disabled',
        '&:hover': {
          color: isLiked ? 'error.dark' : 'error.light',
        }
      }}
    >
      {isLoading ? (
        <CircularProgress size={20} />
      ) : isLiked ? (
        <Favorite />
      ) : (
        <FavoriteBorder />
      )}
    </IconButton>
  );
};