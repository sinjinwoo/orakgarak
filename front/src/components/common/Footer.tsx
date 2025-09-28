import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import { theme, textStyles } from '../../styles/theme';

const Footer: React.FC = () => {
  // 공통 스타일 정의
  const sectionTitleStyles = {
    margin: 0,
    padding: '16px 0 8px 0',
    color: 'rgba(255,255,255,0.2)',
    fontWeight: 'normal',
    textTransform: 'uppercase',
    letterSpacing: '0.25em',
    fontSize: { xs: '14px', sm: '12px' },
    lineHeight: { xs: '20px', sm: '17px' },
  };

  const linkStyles = {
    ...textStyles.caption,
    textDecoration: 'none',
    fontSize: { xs: '13px', sm: '14px' },
    '&:hover': { color: theme.colors.text.primary }
  };

  const listItemStyles = { py: 0.25 };

  // 푸터 섹션 데이터
  const footerSections = [
    {
      title: 'ORAKGARAK',
      links: [
        { label: '홈', href: '/' },
        { label: 'AI 데모', href: '/ai-demo' },
      ]
    },
    {
      title: '음악 서비스',
      links: [
        { label: 'AI 노래 추천', href: '/recommendations' },
        { label: '음역대 테스트', href: '/onboarding/range' },
        { label: '녹음하기', href: '/record' },
        { label: '앨범 만들기', href: '/albums/create' },
      ]
    },
    {
      title: '커뮤니티',
      links: [
        { label: '피드', href: '/feed' },
        { label: '마이페이지', href: '/me' },
        { label: '내 앨범', href: '/me/albums' },
        { label: '내 녹음', href: '/me/recordings' },
      ]
    },
    {
      title: '정보',
      links: [
        { label: '버전: v1.0.0', href: null },
      ]
    },
  ];

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        position: 'relative',
        backgroundColor: '#070617',
        color: theme.colors.text.primary,
        mt: 'auto',
      }}
    >
      <Container 
        maxWidth="lg"
        sx={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* 메인 콘텐츠 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(5, 1fr)',
              lg: 'repeat(6, 1fr)',
            },
            gap: { xs: 2, sm: 3 },
            py: 3,
          }}
        >
          {footerSections.map((section, index) => (
            <Box key={section.title}>
              <Typography variant="h6" sx={sectionTitleStyles}>
                {section.title}
              </Typography>
              <Box component="ul" sx={{ 
                listStyle: 'none', 
                margin: 0, 
                padding: 0,
                ...(section.title === 'Social' && { display: 'flex', gap: 2, flexWrap: 'wrap' })
              }}>
                {section.links.map((link, linkIndex) => (
                  <Box key={linkIndex} component="li" sx={listItemStyles}>
                    {link.href ? (
                      <Link href={link.href} sx={linkStyles}>
                        {link.label}
                      </Link>
                    ) : (
                      <Typography sx={{ ...textStyles.caption, fontSize: { xs: '13px', sm: '14px' } }}>
                        {link.label}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>

        {/* 하단 섹션 */}
        <Box sx={{ 
          borderTop: '1px solid rgba(255,255,255,0.1)', 
          pt: 2, 
          pb: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 2 
        }}>
          <Typography variant="body2" sx={{ ...textStyles.caption }}>
            © 2025 ORAKGARAK. 당신의 목소리로 찾는 완벽한 노래.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ ...textStyles.caption }}>
              Made with
            </Typography>
            <Favorite sx={{ color: theme.colors.accent.pink, fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ ...textStyles.caption }}>
              AI & Music
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;