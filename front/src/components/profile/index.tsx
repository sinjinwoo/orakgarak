/**
 * Profile 관련 컴포넌트들 통합
 * 마이페이지와 프로필 관련 컴포넌트들을 한 곳에 모아 관리합니다.
 */

import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, Button, Chip } from '@mui/material';
import { Edit, Camera, Album, Mic, Favorite, Visibility } from '@mui/icons-material';

// ===== Profile Header =====

interface ProfileHeaderProps {
  profile: {
    nickname: string;
    email?: string;
    profileImageUrl?: string;
    description?: string;
    followerCount?: number;
    followingCount?: number;
  };
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
  onEditImage?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isOwnProfile = false,
  onEditProfile,
  onEditImage
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profile.profileImageUrl}
              sx={{ width: 80, height: 80 }}
            >
              {profile.nickname?.[0]?.toUpperCase()}
            </Avatar>
            {isOwnProfile && (
              <Button
                size="small"
                onClick={onEditImage}
                sx={{
                  position: 'absolute',
                  bottom: -5,
                  right: -5,
                  minWidth: 'auto',
                  borderRadius: '50%',
                  p: 1
                }}
              >
                <Camera fontSize="small" />
              </Button>
            )}
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5">{profile.nickname}</Typography>
              {isOwnProfile && (
                <Button
                  size="small"
                  onClick={onEditProfile}
                  startIcon={<Edit />}
                  variant="outlined"
                >
                  편집
                </Button>
              )}
            </Box>
            
            {profile.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {profile.description}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 3 }}>
              <Typography variant="body2">
                팔로워 <strong>{profile.followerCount || 0}</strong>
              </Typography>
              <Typography variant="body2">
                팔로잉 <strong>{profile.followingCount || 0}</strong>
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ===== Profile Editor =====

interface ProfileEditorProps {
  profile: {
    nickname: string;
    email?: string;
    description?: string;
    gender?: string;
  };
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onSave,
  onCancel,
  isLoading = false
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        프로필 편집
      </Typography>
      <Typography variant="body2" color="text.secondary">
        프로필 정보를 수정할 수 있습니다.
      </Typography>
      {/* TODO: 실제 편집 폼 구현 */}
    </Box>
  );
};

// ===== My Stats =====

interface MyStatsProps {
  stats: {
    albumCount: number;
    recordingCount: number;
    totalPlays: number;
    totalLikes: number;
  };
}

export const MyStats: React.FC<MyStatsProps> = ({ stats }) => {
  const statItems = [
    { label: '앨범', value: stats.albumCount, icon: Album, color: 'primary' },
    { label: '녹음', value: stats.recordingCount, icon: Mic, color: 'secondary' },
    { label: '좋아요', value: stats.totalLikes, icon: Favorite, color: 'error' },
    { label: '재생수', value: stats.totalPlays, icon: Visibility, color: 'info' },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          내 활동 통계
        </Typography>
        <Grid container spacing={2}>
          {statItems.map((item, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Box sx={{ textAlign: 'center' }}>
                <item.icon color={item.color as any} sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h6">{item.value}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// ===== My Albums Grid =====

interface MyAlbumsGridProps {
  albums: any[];
  onAlbumClick?: (album: any) => void;
  isLoading?: boolean;
}

export const MyAlbumsGrid: React.FC<MyAlbumsGridProps> = ({
  albums,
  onAlbumClick,
  isLoading = false
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        내 앨범 ({albums.length})
      </Typography>
      {isLoading ? (
        <Typography>로딩 중...</Typography>
      ) : albums.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          아직 생성한 앨범이 없습니다.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {albums.map((album, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card 
                sx={{ cursor: 'pointer' }}
                onClick={() => onAlbumClick?.(album)}
              >
                <Box
                  sx={{
                    height: 150,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(196, 71, 233, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {album.coverImageUrl && album.coverImageUrl !== '/images/default-album.png' ? (
                    <Box
                      component="img"
                      src={album.coverImageUrl}
                      alt={album.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        // 이미지 로딩 실패 시 숨기기
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {/* 기본 커버 이미지 또는 이미지 로딩 실패 시 표시할 UI */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: (!album.coverImageUrl || album.coverImageUrl === '/images/default-album.png')
                        ? 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 50%, #8B5CF6 100%)'
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: (!album.coverImageUrl || album.coverImageUrl === '/images/default-album.png') ? 1 : -1,
                    }}
                  >
                    {(!album.coverImageUrl || album.coverImageUrl === '/images/default-album.png') && (
                      <Typography
                        sx={{
                          fontSize: '3rem',
                          color: 'rgba(255, 255, 255, 0.8)',
                          textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        ♪
                      </Typography>
                    )}
                  </Box>
                </Box>
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="body2" noWrap>
                    {album.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {album.trackCount}곡
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

// ===== My Recordings Table =====

interface MyRecordingsTableProps {
  recordings: any[];
  onRecordingClick?: (recording: any) => void;
  onRecordingDelete?: (recordingId: string | number) => void;
  isLoading?: boolean;
}

export const MyRecordingsTable: React.FC<MyRecordingsTableProps> = ({
  recordings,
  onRecordingClick,
  onRecordingDelete,
  isLoading = false
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        내 녹음 ({recordings.length})
      </Typography>
      {isLoading ? (
        <Typography>로딩 중...</Typography>
      ) : recordings.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          아직 녹음한 곡이 없습니다.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recordings.map((recording, index) => (
            <Card key={index} sx={{ cursor: 'pointer' }}>
              <CardContent 
                sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => onRecordingClick?.(recording)}
              >
                <Box>
                  <Typography variant="body1">
                    {recording.title || recording.song?.title || 'Unknown Title'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {recording.song?.artist || 'Unknown Artist'} • {Math.floor((recording.duration || 0) / 60)}분
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={recording.processingStatus || 'COMPLETED'} 
                    size="small"
                    color={recording.processingStatus === 'COMPLETED' ? 'success' : 'default'}
                  />
                  {onRecordingDelete && (
                    <Button
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRecordingDelete(recording.id);
                      }}
                    >
                      삭제
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ===== My AI Cover Gallery =====

interface MyAICoverGalleryProps {
  covers: any[];
  onCoverClick?: (cover: any) => void;
  isLoading?: boolean;
}

export const MyAICoverGallery: React.FC<MyAICoverGalleryProps> = ({
  covers,
  onCoverClick,
  isLoading = false
}) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        AI 생성 커버 ({covers.length})
      </Typography>
      {isLoading ? (
        <Typography>로딩 중...</Typography>
      ) : covers.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          아직 생성한 AI 커버가 없습니다.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {covers.map((cover, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card 
                sx={{ cursor: 'pointer' }}
                onClick={() => onCoverClick?.(cover)}
              >
                <Box
                  sx={{
                    height: 150,
                    backgroundImage: `url(${cover.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <CardContent sx={{ p: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(cover.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
