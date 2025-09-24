import React, { useState, useEffect } from "react";
import { Typography, Button, Box, Avatar } from "@mui/material";
import { MusicNote, Person } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useSocialAuth } from "../../hooks/useAuth";
import { theme } from "../../styles/theme";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { loginWithGoogle, isLoading } = useSocialAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  const isLandingPage = location.pathname === "/";

  // 스크롤 이벤트 핸들러 - 성능 최적화를 위해 쓰로틀링 적용
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleScroll = () => {
      // 쓰로틀링: 16ms (약 60fps)마다 실행
      if (timeoutId) return;

      timeoutId = setTimeout(() => {
        const scrollTop = window.scrollY;
        setIsScrolled(scrollTop > 50);
        timeoutId = undefined as unknown as NodeJS.Timeout;
      }, 16);
    };

    if (isLandingPage) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll(); // 초기 상태 설정
    } else {
      setIsScrolled(false);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLandingPage]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate("/recommendations");
    }
  };

  const menuItems = [
    { label: "추천", path: "/recommendations" },
    { label: "녹음", path: "/record" },
    { label: "피드", path: "/feed" },
    { label: "앨범 만들기", path: "/albums/create" },
    { label: "마이페이지", path: "/me" },
    { label: "AI 데모", path: "/ai-demo" },
  ];

  // 동적 스타일 계산
  const headerBackground = isLandingPage
    ? isScrolled
      ? "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%)"
      : "transparent"
    : "linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%)";

  const shouldShowShadow = isLandingPage ? isScrolled : true;

  // 공통 버튼 스타일
  const baseButtonStyles = {
    color: theme.colors.text.primary,
    fontSize: "15px",
    fontWeight: 500,
    transition: "all 0.3s ease",
    textTransform: "none" as const,
    textShadow: isLandingPage && !isScrolled ? theme.shadows.text : "none",
    borderRadius: theme.borderRadius.medium,
    whiteSpace: "nowrap" as const,
    "&:hover": {
      transform: "translateY(-1px)",
      backgroundColor: theme.colors.glassmorphism.background,
    },
    "&:focus": {
      outline: "none",
      backgroundColor: theme.colors.glassmorphism.background,
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.colors.glassmorphism.border}`,
      outlineOffset: "2px",
    },
  };

  const authButtonStyles = {
    ...baseButtonStyles,
    padding: "10px 20px",
    backgroundColor: theme.colors.glassmorphism.background,
    border: `1px solid ${theme.colors.glassmorphism.border}`,
    backdropFilter: theme.colors.glassmorphism.backdropFilter,
    "&:hover": {
      transform: "translateY(-1px)",
      backgroundColor: theme.colors.glassmorphism.backgroundHover,
      borderColor: "rgba(255, 255, 255, 0.4)",
    },
    "&:disabled": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      color: theme.colors.text.muted,
      borderColor: "rgba(255, 255, 255, 0.1)",
    },
  };

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        background: headerBackground,
        backdropFilter: shouldShowShadow ? "blur(20px)" : "none",
        borderBottom: shouldShowShadow
          ? `1px solid ${theme.colors.glassmorphism.border}`
          : "none",
        boxShadow: shouldShowShadow ? theme.shadows.card : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: { xs: "20px 16px", sm: "24px 32px" },
          maxWidth: "1400px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* 로고 (랜딩 페이지에서는 공간은 유지, 버튼은 숨김) */}
        <Box
          component="button"
          onClick={() => navigate("/")}
          sx={{
            ...baseButtonStyles,
            padding: "8px",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 1,
            visibility: isLandingPage ? 'hidden' : 'visible',
            pointerEvents: isLandingPage ? 'none' : 'auto'
          }}
        >
          {/* 로고 이미지 (front/public 경로 사용) - 랜딩 페이지에서는 숨김 */}
          {!isLandingPage && (
            <Box
              component="img"
              src="/assets/images/orakgrak_logo.png"
              alt="오락가락 로고"
              sx={{
                width: 40,
                height: 40,
                objectFit: "contain",
                filter:
                  isLandingPage && !isScrolled
                    ? "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
                    : "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                transition: "all 0.3s ease",
                // 레이아웃 높이는 유지하고 시각적으로만 확대
                transform: 'scale(3.2)',
                transformOrigin: 'center',
                pointerEvents: 'none'
              }}
            />
          )}
        </Box>

        {/* 네비게이션 메뉴 */}
        <Box
          component="nav"
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 1,
          }}
        >
          {menuItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                ...baseButtonStyles,
                padding: "10px 20px",
                position: "relative",
              }}
            >
              {item.label}
              {item.label === "AI 데모" && (
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    fontSize: "8px",
                    fontWeight: 500,
                    backgroundColor: "transparent",
                    color: "#ff6b6b",
                    lineHeight: 1,
                  }}
                >
                  beta
                </Box>
              )}
            </Button>
          ))}
        </Box>

        {/* 사용자 영역 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isAuthenticated ? (
            <>
              {/* 유저 정보 */}
              <Button
                onClick={() => navigate("/me")}
                sx={{
                  ...baseButtonStyles,
                  padding: "8px 16px",
                  backgroundColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: "auto",
                }}
              >
                <Avatar
                  src={user?.profileImageUrl || user?.profileImage}
                  sx={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.colors.glassmorphism.border}`,
                    boxShadow: theme.shadows.card,
                  }}
                >
                  <Person sx={{ fontSize: "20px" }} />
                </Avatar>
                <Typography
                  component="span"
                  sx={{
                    color: theme.colors.text.primary,
                    fontSize: "14px",
                    fontWeight: 500,
                    textShadow:
                      isLandingPage && !isScrolled
                        ? theme.shadows.text
                        : "none",
                  }}
                >
                  {user?.nickname || "사용자"}
                </Typography>
              </Button>

              {/* 로그아웃 버튼 */}
              <Button onClick={handleLogout} sx={authButtonStyles}>
                로그아웃
              </Button>
            </>
          ) : (
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              sx={authButtonStyles}
            >
              {isLoading ? "로그인 중..." : "구글 로그인"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
