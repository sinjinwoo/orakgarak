import React from 'react';
import { Box, Container, Typography, Link, Grid } from '@mui/material';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.100',
        py: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              서비스
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI 노래방 서비스로<br />
              당신의 목소리로 만드는<br />
              특별한 음악 경험을 제공합니다.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              기능
            </Typography>
            <Box>
              <Link href="/recommendations" color="inherit" underline="hover">
                <Typography variant="body2">맞춤 추천</Typography>
              </Link>
              <Link href="/record" color="inherit" underline="hover">
                <Typography variant="body2">녹음 & 분석</Typography>
              </Link>
              <Link href="/albums/create" color="inherit" underline="hover">
                <Typography variant="body2">앨범 제작</Typography>
              </Link>
              <Link href="/feed" color="inherit" underline="hover">
                <Typography variant="body2">소셜 피드</Typography>
              </Link>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              지원
            </Typography>
            <Box>
              <Typography variant="body2" color="text.secondary">
                이용약관
              </Typography>
              <Typography variant="body2" color="text.secondary">
                개인정보처리방침
              </Typography>
              <Typography variant="body2" color="text.secondary">
                고객지원
              </Typography>
              <Typography variant="body2" color="text.secondary">
                FAQ
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              팀 소개
            </Typography>
            <Typography variant="body2" color="text.secondary">
              SSAFY 13기<br />
              P21 C103 팀<br />
              <br />
              문의: contact@ainoraebang.com
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ borderTop: 1, borderColor: 'divider', mt: 3, pt: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © 2024 AI 노래방 서비스. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
