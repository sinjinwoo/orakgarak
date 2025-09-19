// 공통 테마 스타일 상수
export const theme = {
  colors: {
    // 기본 색상 팔레트
    primary: {
      main: '#C147E9',
      light: '#C951EA', 
      dark: '#8B5CF6',
      gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
      gradientHover: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
    },
    accent: {
      pink: '#FF6B9D',
      purple: '#8B5CF6',
      lightPink: '#FF7BA7',
    },
    
    // 배경 색상
    background: {
      main: `
        radial-gradient(circle at 20% 20%, rgba(255, 107, 157, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(196, 71, 233, 0.25) 0%, transparent 50%),
        radial-gradient(circle at 40% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
        linear-gradient(135deg, #0A0A0A 0%, #1A0A1A 25%, #2A0A2A 50%, #1A0A1A 75%, #0A0A0A 100%)
      `,
      overlay: `
        radial-gradient(circle at 30% 30%, rgba(255, 107, 157, 0.1) 0%, transparent 40%),
        radial-gradient(circle at 70% 70%, rgba(196, 71, 233, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 30%)
      `,
    },
    
    // 텍스트 색상
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.8)',
      tertiary: 'rgba(255, 255, 255, 0.6)',
      muted: 'rgba(255, 255, 255, 0.5)',
    },
    
    // 글래스모피즘 효과
    glassmorphism: {
      background: 'rgba(255, 255, 255, 0.1)',
      backgroundHover: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
    },
    
    // 네비게이션
    navigation: {
      background: 'rgba(0, 0, 0, 0.5)',
      backgroundHover: 'rgba(196, 71, 233, 0.3)',
    },
    
    // 페이지네이션
    pagination: {
      inactive: 'rgba(255, 255, 255, 0.3)',
      active: '#C147E9',
    },
  },
  
  // 그림자 효과
  shadows: {
    glow: '0 4px 20px rgba(196, 71, 233, 0.4)',
    glowHover: '0 6px 25px rgba(196, 71, 233, 0.6)',
    card: '0 8px 32px rgba(0, 0, 0, 0.3)',
    cardHover: '0 12px 40px rgba(0, 0, 0, 0.4)',
    text: '0 1px 2px rgba(0, 0, 0, 0.5)',
    textStrong: '0 2px 4px rgba(0, 0, 0, 0.8)',
  },
  
  // 테두리 반경
  borderRadius: {
    small: 2,
    medium: 4,
    large: 8,
  },
  
  // 브레이크포인트
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '900px',
    lg: '1200px',
    xl: '1536px',
  },
} as const;

// 공통 버튼 스타일
export const buttonStyles = {
  primary: {
    background: theme.colors.primary.gradient,
    color: theme.colors.text.primary,
    borderRadius: theme.borderRadius.small,
    textTransform: 'none' as const,
    fontWeight: 600,
    boxShadow: theme.shadows.glow,
    '&:hover': {
      background: theme.colors.primary.gradientHover,
      boxShadow: theme.shadows.glowHover,
      transform: 'translateY(-2px)',
    },
  },
  glassmorphism: {
    background: theme.colors.glassmorphism.background,
    backdropFilter: theme.colors.glassmorphism.backdropFilter,
    border: `1px solid ${theme.colors.glassmorphism.border}`,
    borderRadius: theme.borderRadius.medium,
    boxShadow: theme.shadows.card,
    '&:hover': {
      background: theme.colors.glassmorphism.backgroundHover,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.cardHover,
    },
  },
} as const;

// 공통 텍스트 스타일
export const textStyles = {
  title: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    background: theme.colors.primary.gradient,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: theme.shadows.textStrong,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontWeight: 500,
    textShadow: theme.shadows.text,
  },
  body: {
    color: theme.colors.text.secondary,
    textShadow: theme.shadows.text,
  },
  caption: {
    color: theme.colors.text.tertiary,
    textShadow: theme.shadows.text,
  },
} as const;