import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import { LikeButton, FollowButton } from '../common';

interface SocialToggleExampleProps {
  albumId?: number;
  userId?: number;
}

export const SocialToggleExample: React.FC<SocialToggleExampleProps> = ({
  albumId = 1,
  userId = 1
}) => {
  const [likeMessage, setLikeMessage] = useState<string>('');
  const [followMessage, setFollowMessage] = useState<string>('');
  const [showLikeSnackbar, setShowLikeSnackbar] = useState(false);
  const [showFollowSnackbar, setShowFollowSnackbar] = useState(false);

  const handleLikeChange = (isLiked: boolean) => {
    setLikeMessage(isLiked ? '좋아요를 추가했습니다!' : '좋아요를 취소했습니다!');
    setShowLikeSnackbar(true);
  };

  const handleFollowChange = (isFollowing: boolean) => {
    setFollowMessage(isFollowing ? '팔로우했습니다!' : '언팔로우했습니다!');
    setShowFollowSnackbar(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        소셜 토글 기능 예제
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                좋아요 토글 버튼
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                앨범에 좋아요를 추가하거나 제거할 수 있습니다.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <LikeButton
                  albumId={albumId}
                  onLikeChange={handleLikeChange}
                  size="small"
                />
                <LikeButton
                  albumId={albumId}
                  onLikeChange={handleLikeChange}
                  size="medium"
                />
                <LikeButton
                  albumId={albumId}
                  onLikeChange={handleLikeChange}
                  size="large"
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                버튼을 클릭하면 좋아요가 토글됩니다. 하트 아이콘이 채워지면 좋아요 상태입니다.
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                팔로우 토글 버튼
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                사용자를 팔로우하거나 언팔로우할 수 있습니다.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <FollowButton
                  userId={userId}
                  onFollowChange={handleFollowChange}
                  size="small"
                  variant="contained"
                />
                <FollowButton
                  userId={userId}
                  onFollowChange={handleFollowChange}
                  size="medium"
                  variant="outlined"
                />
                <FollowButton
                  userId={userId}
                  onFollowChange={handleFollowChange}
                  size="large"
                  variant="text"
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                버튼을 클릭하면 팔로우 상태가 토글됩니다. 버튼 텍스트와 아이콘이 상태에 따라 변경됩니다.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 스낵바 알림 */}
      <Snackbar
        open={showLikeSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowLikeSnackbar(false)}
      >
        <Alert severity="success" onClose={() => setShowLikeSnackbar(false)}>
          {likeMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={showFollowSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowFollowSnackbar(false)}
      >
        <Alert severity="success" onClose={() => setShowFollowSnackbar(false)}>
          {followMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};