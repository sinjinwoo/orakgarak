import React from 'react';
import { Container, Typography, Box, Button, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  MusicNote, 
  Mic, 
  Album, 
  People, 
  TrendingUp, 
  Psychology,
  AutoAwesome,
  RecordVoiceOver
} from '@mui/icons-material';
import { useSocialAuth } from '../hooks/useAuth';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoading } = useSocialAuth();

  const handleGetStarted = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate('/onboarding/range');
    }
    // 로그인 실패 시에는 랜딩 페이지에 그대로 머물러 있음
  };

  const features = [
    {
      icon: <MusicNote sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: '맞춤형 노래 추천',
      description: 'AI가 분석한 당신의 음역대와 음색에 딱 맞는 노래를 추천해드립니다.'
    },
    {
      icon: <Mic sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: '실시간 음성 분석',
      description: '녹음하면서 실시간으로 피치, 박자, 강세를 분석하고 피드백을 제공합니다.'
    },
    {
      icon: <Album sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: '개인 앨범 제작',
      description: '녹음한 곡들을 모아 나만의 앨범을 만들고 커버 아트까지 AI로 생성할 수 있습니다.'
    },
    {
      icon: <People sx={{ fontSize: 40, color: '#1976d2' }} />,
      title: '음악 커뮤니티',
      description: '다른 사용자들과 앨범을 공유하고 서로의 음악을 감상하며 소통할 수 있습니다.'
    }
  ];

  return (
    <Box sx={{ backgroundColor: 'white', minHeight: '100vh' }}>
      {/* 메인 히어로 섹션 */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 12,
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              mb: 3,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            오락가락
          </Typography>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: 4, 
              opacity: 0.9,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            내 목소리에 딱 맞는 노래를 찾아보세요
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 6, 
              opacity: 0.8,
              fontSize: '1.1rem',
              lineHeight: 1.6
            }}
          >
            AI 기술을 활용한 맞춤형 노래 추천과 음성 분석으로<br />
            더 나은 노래 실력을 향상시켜보세요
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            disabled={isLoading}
            sx={{ 
              backgroundColor: 'white',
              color: '#667eea',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '로그인 중...' : '구글로 시작하기'}
          </Button>
        </Container>
      </Box>

      {/* 주요 기능 섹션 */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h3" 
          component="h2" 
          textAlign="center" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            mb: 6,
            color: '#333'
          }}
        >
          주요 기능
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {features.map((feature, index) => (
            <Card 
              key={index}
              sx={{ 
                textAlign: 'center',
                p: 3,
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography 
                  variant="h6" 
                  component="h3" 
                  gutterBottom
                  sx={{ fontWeight: 'bold', color: '#333' }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ lineHeight: 1.6 }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* AI 기술 소개 섹션 */}
      <Box sx={{ backgroundColor: '#f8f9fa', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  color: '#333',
                  mb: 3
                }}
              >
                AI 음성 분석 기술
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3,
                  fontSize: '1.1rem',
                  lineHeight: 1.7,
                  color: '#666'
                }}
              >
                최신 AI 기술을 활용하여 당신의 음성을 정확하게 분석합니다. 
                음역대, 음색, 발성 특성을 파악하고 이를 바탕으로 
                가장 적합한 노래를 추천해드립니다.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ color: '#1976d2' }} />
                  <Typography variant="body2">음성 인식</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome sx={{ color: '#1976d2' }} />
                  <Typography variant="body2">AI 추천</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RecordVoiceOver sx={{ color: '#1976d2' }} />
                  <Typography variant="body2">실시간 분석</Typography>
                </Box>
              </Box>
            </Box>
            
            <Box 
              sx={{ 
                backgroundColor: '#e3f2fd',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                AI 음성 분석 시각화 영역
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* CTA 섹션 */}
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              mb: 3,
              color: '#333'
            }}
          >
            지금 시작해보세요
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4,
              color: '#666',
              fontWeight: 'normal'
            }}
          >
            몇 분만 투자하면 당신만의 맞춤형 음악 여행이 시작됩니다
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={handleGetStarted}
            disabled={isLoading}
            sx={{ 
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {isLoading ? '로그인 중...' : '구글로 무료 시작하기'}
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage;
