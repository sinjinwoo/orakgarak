import React from 'react';
import { Container, Typography, Box, Paper, Button, Card, CardContent } from '@mui/material';
import { Add, Album, Mic, MusicNote } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const MyPage: React.FC = () => {
  const navigate = useNavigate();

  const handleCreateAlbum = () => {
    navigate('/albums/create');
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
            마이페이지
          </Typography>
          
          {/* 앨범 생성 섹션 */}
          <Card sx={{ mb: 4, p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                앨범 관리
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                새로운 앨범을 생성하거나 기존 앨범을 관리할 수 있습니다.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateAlbum}
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                새 앨범 만들기
              </Button>
            </CardContent>
          </Card>

          {/* 내 앨범 목록 */}
          <Card sx={{ mb: 4, p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                내 앨범 목록
              </Typography>
              <Typography variant="body2" color="text.secondary">
                아직 생성된 앨범이 없습니다. 새 앨범을 만들어보세요!
              </Typography>
            </CardContent>
          </Card>

          {/* 녹음 목록 */}
          <Card sx={{ p: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                내 녹음 목록
              </Typography>
              <Typography variant="body2" color="text.secondary">
                아직 녹음한 곡이 없습니다. 녹음 페이지에서 새로운 곡을 녹음해보세요!
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Container>
    </Box>
  );
};

export default MyPage;
