import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardMedia,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import {
  PlayArrow,
  ExpandMore,
  Favorite,
  Share,
  MoreVert,
  Lock,
  Send,
} from '@mui/icons-material';

interface AlbumPreviewStepProps {
  title: string;
  description: string;
  coverImage?: string;
  isPublic: boolean;
  selectedRecordings: string[];
  onPublish: () => void;
  onPrev: () => void;
}

const AlbumPreviewStep: React.FC<AlbumPreviewStepProps> = ({
  title,
  description,
  coverImage,
  isPublic,
  selectedRecordings,
  onPublish,
  onPrev,
}) => {
  // 더미 데이터
  const dummyTracks = [
    { id: '1', title: '좋아', artist: '윤종신', score: 85, duration: '3:45' },
    { id: '2', title: '사랑은 은하수 다방에서', artist: '10cm', score: 78, duration: '4:12' },
    { id: '3', title: '밤편지', artist: '아이유', score: 92, duration: '3:23' },
    { id: '4', title: 'Spring Day', artist: 'BTS', score: 81, duration: '4:06' },
    { id: '5', title: '너를 만나', artist: '폴킴', score: 88, duration: '3:58' },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#2196f3';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const totalDuration = '20분'; // 더미 데이터

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 48, color: '#2c2c2c' }}>👁️</Typography>
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" color="text.secondary">
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 앨범 미리보기 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
          ◎ 앨범 미리보기
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          발행하기 전에 앨범이 어떻게 보일지 확인해보세요
        </Typography>

        {/* 앨범 카드 */}
        <Card sx={{ maxWidth: 400, mx: 'auto', mb: 3 }}>
          <Box sx={{ display: 'flex', p: 2 }}>
            <CardMedia
              component="img"
              sx={{ width: 120, height: 120, borderRadius: 1 }}
              image={coverImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'}
              alt="Album cover"
            />
            <CardContent sx={{ flex: 1, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {title || '앨범 제목'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                음악러버 • 2025. 1. 15.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                ♫ {selectedRecordings.length}곡 • {totalDuration}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {title || '앨범 제목'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <Lock sx={{ fontSize: 14, color: '#666' }} />
                <Typography variant="body2" color="text.secondary">
                  {isPublic ? '공개 앨범' : '비공개 앨범'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  backgroundColor: '#2c2c2c',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: '#1a1a1a',
                  },
                }}
              >
                ▷ 전체 재생
              </Button>
            </CardContent>
          </Box>
        </Card>

        {/* 수록곡 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center' }}>
            ♪ 수록곡
          </Typography>
          <List sx={{ bgcolor: '#f9f9f9', borderRadius: 1 }}>
            {dummyTracks.map((track, index) => (
              <ListItem key={track.id} sx={{ py: 1 }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                      {index + 1}.
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {track.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      - {track.artist}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: getScoreColor(track.score),
                        fontWeight: 600,
                      }}
                    >
                      {track.score}점
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {track.duration}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small">
                  <PlayArrow sx={{ color: '#666' }} />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* 앨범 설명 */}
        {description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
              {description}
            </Typography>
          </Box>
        )}


        {/* 액션 버튼들 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ExpandMore />}
            sx={{
              borderColor: '#2c2c2c',
              color: '#2c2c2c',
              '&:hover': {
                borderColor: '#1a1a1a',
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            몰입 재생
          </Button>
        </Box>
      </Paper>

      {/* 발행 준비 완료 */}
      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f9f9f9' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          앨범 발행 준비 완료!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isPublic ? '공개 앨범으로 발행하면 다른 사용자들이 볼 수 있습니다.' : '비공개 앨범으로 발행하면 나만 볼 수 있습니다.'}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={onPublish}
          sx={{
            backgroundColor: '#2c2c2c',
            color: 'white',
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: '#1a1a1a',
            },
          }}
        >
          ✔ 앨범 발행하기
        </Button>
      </Paper>

      {/* 네비게이션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={onPrev}
          sx={{
            borderColor: '#2c2c2c',
            color: '#2c2c2c',
            '&:hover': {
              borderColor: '#1a1a1a',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          ← 이전 단계
        </Button>
      </Box>
    </Box>
  );
};

export default AlbumPreviewStep;
