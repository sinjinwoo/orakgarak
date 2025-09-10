import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Button, Card, CardContent } from '@mui/material';
import { CloudUpload, PlayArrow, Stop, MusicNote } from '@mui/icons-material';

const AIDemoPage: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploaded(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    // 실제 재생 로직 구현 예정
    setTimeout(() => setIsPlaying(false), 5000); // 5초 후 정지
  };

  return (
    <Box sx={{ flex: 1, backgroundColor: '#fafafa' }}>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            backgroundColor: 'white',
            borderRadius: 2,
            minHeight: '60vh'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: '#2c2c2c',
              mb: 3
            }}
          >
            AI 데모
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: '1.1rem', mb: 4 }}
          >
            녹음본을 업로드하면 AI가 분석하여 내 목소리로 지정한 노래를 들어볼 수 있습니다.
          </Typography>

          {/* 업로드 섹션 */}
          <Card sx={{ mb: 4, p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                음성 파일 업로드
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <input
                  accept="audio/*"
                  style={{ display: 'none' }}
                  id="audio-upload"
                  type="file"
                  onChange={handleFileUpload}
                />
                <label htmlFor="audio-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    sx={{ 
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      '&:hover': {
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    파일 선택
                  </Button>
                </label>
                {isUploaded && (
                  <Typography variant="body2" color="success.main">
                    ✓ 파일이 업로드되었습니다
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                지원 형식: MP3, WAV, M4A (최대 10MB)
              </Typography>
            </CardContent>
          </Card>

          {/* AI 분석 섹션 */}
          <Card sx={{ mb: 4, p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                AI 음성 분석
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <MusicNote sx={{ color: '#1976d2' }} />
                <Typography variant="body1">
                  음역대: C3 - C5
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <MusicNote sx={{ color: '#1976d2' }} />
                <Typography variant="body1">
                  음색 특성: 따뜻하고 안정적
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MusicNote sx={{ color: '#1976d2' }} />
                <Typography variant="body1">
                  추천 장르: 발라드, 팝
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* 재생 섹션 */}
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                AI 커버 생성 결과
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                선택된 노래: "너를 사랑해" - 김철수
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={isPlaying ? <Stop /> : <PlayArrow />}
                  onClick={handlePlay}
                  disabled={!isUploaded}
                  sx={{
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0'
                    }
                  }}
                >
                  {isPlaying ? '정지' : '재생'}
                </Button>
                {isPlaying && (
                  <Typography variant="body2" color="text.secondary">
                    재생 중...
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
};

export default AIDemoPage;
