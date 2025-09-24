import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Paper, Button, Card, CardContent } from '@mui/material';
import { CloudUpload, PlayArrow, Stop, MusicNote } from '@mui/icons-material';

const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes pulseGlow {
      0% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
      100% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
    }
  `;

const AIDemoPage: React.FC = () => {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploaded(true);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 5000);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
          radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
        `,
      color: '#fff',
      paddingTop: '80px',
    }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      <div style={{
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00ffff, #ff0080)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 10px 0',
              textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
            }}>
              AI VOICE ANALYSIS
            </h1>
            <p style={{
              color: '#00ffff',
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              Experience the future of voice conversion
            </p>
          </div>

          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              background: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ fontSize: '1.1rem', mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}
            >
              녹음본을 업로드하면 AI가 분석하여 내 목소리로 지정한 노래를 들어볼 수 있습니다.
            </Typography>

            {[{
              title: '음성 파일 업로드',
              content: (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <input
                      accept="audio/*"
                      style={{ display: 'none' }}
                      id="audio-upload"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="audio-upload">
                      <Button variant="contained" component="span" startIcon={<CloudUpload />} sx={{ background: 'linear-gradient(45deg, #00ffff, #ff0080)', color: '#000', fontWeight: 'bold' }}>
                        파일 선택
                      </Button>
                    </label>
                    {isUploaded && <Typography variant="body2" sx={{ color: '#00ff80' }}>✓ 파일이 업로드되었습니다</Typography>}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    지원 형식: MP3, WAV, M4A (최대 10MB)
                  </Typography>
                </>
              )
            }, {
              title: 'AI 음성 분석',
              content: (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <MusicNote sx={{ color: '#00ffff' }} />
                    <Typography variant="body1">음역대: C3 - C5</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <MusicNote sx={{ color: '#00ffff' }} />
                    <Typography variant="body1">음색 특성: 따뜻하고 안정적</Typography>
                  </Box>
                </>
              )
            }, {
              title: 'AI 커버 생성 결과',
              content: (
                <>
                  <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.8)' }}>
                    선택된 노래: "너를 사랑해" - 김철수
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="contained" startIcon={isPlaying ? <Stop /> : <PlayArrow />} onClick={handlePlay} disabled={!isUploaded} sx={{ background: 'linear-gradient(45deg, #00ffff, #ff0080)', color: '#000', fontWeight: 'bold' }}>
                      {isPlaying ? '정지' : '재생'}
                    </Button>
                    {isPlaying && <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>재생 중...</Typography>}
                  </Box>
                </>
              )
            }].map((section, index) => (
              <Card key={index} sx={{ mb: 4, p: 2, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '10px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#00ffff' }}>
                    {section.title}
                  </Typography>
                  {section.content}
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Container>
      </div>
    </div>
  );
};

export default AIDemoPage;