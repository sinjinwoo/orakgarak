import React from 'react';
import { Box, Container, Typography, Link } from '@mui/material';
import { Favorite } from '@mui/icons-material';
import { theme, textStyles } from '../../styles/theme';

const Footer: React.FC = () => {
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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            py: 3,
            gap: 3,
            // 반응형 스타일 - 가로 레이아웃
            '& > *': {
              flex: { xs: '1 1 45%', sm: '1 1 30%', md: '1 1 18%', lg: '1 1 15%' },
              minWidth: { xs: '140px', sm: '160px', md: '180px' },
              padding: { xs: '0 8px 16px 8px', sm: '0 12px 20px 12px', md: '0 16px 20px 16px' },
            },
            // Social 섹션은 모바일에서도 가로로 배치
            '& > *:last-child': {
              flex: { xs: '1 1 45%', sm: '1 1 30%', md: '1 1 18%', lg: '1 1 15%' },
            },
          }}
        >
          {/* Company */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                padding: '16px 0 8px 0',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                fontSize: { xs: '14px', sm: '12px' },
                lineHeight: { xs: '20px', sm: '17px' },
              }}
            >
              Company
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  홈
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/ai-demo" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  AI 데모
                </Link>
              </Box>
            </Box>
          </Box>

          {/* Products */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                padding: '16px 0 8px 0',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                fontSize: { xs: '14px', sm: '12px' },
                lineHeight: { xs: '20px', sm: '17px' },
              }}
            >
              Products
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/recommendations" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  노래 추천
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/record" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  녹음하기
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/albums/create" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  앨범 만들기
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/feed" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  커뮤니티
                </Link>
              </Box>
            </Box>
          </Box>

          {/* Accounts */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                padding: '16px 0 8px 0',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                fontSize: { xs: '14px', sm: '12px' },
                lineHeight: { xs: '20px', sm: '17px' },
              }}
            >
              Accounts
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/me" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  마이페이지
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/me/edit" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  프로필 편집
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/me/recordings" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  내 녹음
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/me/albums" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  내 앨범
                </Link>
              </Box>
            </Box>
          </Box>

          {/* Resources */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                padding: '16px 0 8px 0',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                fontSize: { xs: '14px', sm: '12px' },
                lineHeight: { xs: '20px', sm: '17px' },
              }}
            >
              Resources
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/onboarding/range" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  음역대 테스트
                </Link>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Link href="/me/ai-covers" sx={{ ...textStyles.caption, textDecoration: 'none', fontSize: { xs: '13px', sm: '14px' }, '&:hover': { color: theme.colors.text.primary } }}>
                  AI 커버 갤러리
                </Link>
              </Box>
            </Box>
          </Box>

          {/* Support */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                padding: '16px 0 8px 0',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                fontSize: { xs: '14px', sm: '12px' },
                lineHeight: { xs: '20px', sm: '17px' },
              }}
            >
              Support
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <Box component="li" sx={{ py: 0.25 }}>
                <Typography sx={{ ...textStyles.caption, fontSize: { xs: '13px', sm: '14px' } }}>
                  문의: support@orak.or.kr
                </Typography>
              </Box>
              <Box component="li" sx={{ py: 0.25 }}>
                <Typography sx={{ ...textStyles.caption, fontSize: { xs: '13px', sm: '14px' } }}>
                  버전: v1.0.0
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Social */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                margin: 0,
                padding: '16px 0 8px 0',
                color: 'rgba(255,255,255,0.2)',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '0.25em',
                fontSize: { xs: '14px', sm: '12px' },
                lineHeight: { xs: '20px', sm: '17px' },
              }}
            >
              Social
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box component="li" sx={{ display: 'inline-block' }}>
                <Typography sx={{ ...textStyles.caption, fontSize: { xs: '13px', sm: '14px' } }}>
                  준비 중...
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bottom Section */}
        <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ ...textStyles.caption }}>
            © 2025 오락가락 All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ ...textStyles.caption }}>
              Made with
            </Typography>
            <Favorite sx={{ color: theme.colors.accent.pink, fontSize: '1rem' }} />
            <Typography variant="body2" sx={{ ...textStyles.caption }}>
              in Korea
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
