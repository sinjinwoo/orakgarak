import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Favorite } from '@mui/icons-material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#2c2c2c',
        py: 4,
        mt: 'auto',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* 브랜드 정보 */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              오락가락
            </Typography>
            <Typography variant="body2" sx={{ color: '#b0b0b0', lineHeight: 1.6 }}>
              내 목소리에 딱 맞는 노래를 찾아보세요
            </Typography>
          </Box>
          
          {/* 서비스 링크 */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              서비스
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/recommendations" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                노래 추천
              </Link>
              <Link href="/record" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                녹음하기
              </Link>
              <Link href="/feed" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                커뮤니티
              </Link>
              <Link href="/me" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                마이페이지
              </Link>
            </Box>
          </Box>
          
          {/* 고객지원 */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              고객지원
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                문의하기
              </Link>
              <Link href="#" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                자주 묻는 질문
              </Link>
            </Box>
          </Box>
          
          {/* 약관 */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              약관
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="#" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                이용약관
              </Link>
              <Link href="#" sx={{ color: '#b0b0b0', textDecoration: 'none', '&:hover': { color: 'white' } }}>
                개인정보처리방침
              </Link>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ borderTop: '1px solid #404040', mt: 3, pt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
            © 2025 오락가락 All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              Made with
            </Typography>
            <Favorite sx={{ color: '#ff6b6b', fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ color: '#b0b0b0' }}>
              in Korea
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
