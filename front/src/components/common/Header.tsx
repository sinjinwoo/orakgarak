import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Typography, Button, Box, Avatar, Menu, MenuItem, Fade } from "@mui/material";
import { Person, Logout, AccountCircle } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useSocialAuth } from "../../hooks/useAuth";
import { useAlbumStore } from "../../stores/albumStore";
import { useUIStore } from "../../stores/uiStore";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { loginWithGoogle, isLoading: isSocialLoading } = useSocialAuth();
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [userActivity, setUserActivity] = useState(false);
  const [headerMode, setHeaderMode] = useState<'auto' | 'fixed' | 'hidden'>('auto');
  const profileMenuOpen = Boolean(profileMenuAnchor);

  // 스토어 상태 가져오기
  const { creationState } = useAlbumStore();
  const { isLoading: isUILoading } = useUIStore();

  const isLandingPage = location.pathname === "/";

  // 메뉴 아이템 메모이제이션
  const menuItems = useMemo(() => [
    { label: "추천", path: "/recommendations" },
    { label: "목 풀기 게임", path: "/voice-test" },
    { label: "녹음", path: "/record" },
    { label: "피드", path: "/feed" },
    { label: "앨범 만들기", path: "/albums/create" },
    { label: "AI 데모", path: "/ai-demo" },
  ], []);

  // 스타일 객체 메모이제이션
  const styles = useMemo(() => ({
    baseButton: {
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 500,
      textTransform: "none" as const,
      borderRadius: "8px",
      whiteSpace: "nowrap" as const,
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      },
    },
    authButton: {
      padding: "6px 12px",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "#ffffff",
      fontSize: "14px",
      fontWeight: 500,
      textTransform: "none" as const,
      borderRadius: "8px",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
      },
    },
  }), []);

  // 헤더 표시/숨김 관리
  const showHeader = useCallback(() => {
    setIsHeaderVisible(true);
  }, []);

  const hideHeader = useCallback(() => {
    setIsHeaderVisible(false);
  }, []);

  // 페이지별 헤더 모드 설정
  useEffect(() => {
    switch (location.pathname) {
      case '/voice-test':
        setHeaderMode('hidden'); // 게임 페이지는 숨김
        break;
      case '/albums/create':
        setHeaderMode('fixed'); // 앨범 생성은 고정
        showHeader();
        break;
      default:
        // 앨범 디테일 페이지 확인 (동적 라우트)
        if (location.pathname.startsWith('/albums/') && location.pathname !== '/albums/create') {
          setHeaderMode('hidden'); // 앨범 디테일 페이지는 숨김
        } else {
          setHeaderMode('auto'); // 기본 자동 모드 (녹음 포함)
        }
    }
  }, [location.pathname, showHeader]);

  // 앨범 생성 중 헤더 고정
  useEffect(() => {
    if (creationState.step > 0) {
      setHeaderMode('fixed');
      showHeader();
    }
  }, [creationState.step, showHeader]);

  // 사용자 활동 감지
  useEffect(() => {
    const handleUserActivity = () => {
      setUserActivity(true);
      if (headerMode === 'auto') {
        showHeader();
      }
    };

    const handleInactivity = () => {
      setUserActivity(false);
      if (headerMode === 'auto') {
        hideHeader();
      }
    };

    // 마우스, 키보드, 터치 이벤트 감지
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // 3초간 비활성 시 헤더 숨김
    const inactivityTimer = setInterval(() => {
      if (userActivity && headerMode === 'auto') {
        handleInactivity();
      }
    }, 3000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      clearInterval(inactivityTimer);
    };
  }, [userActivity, headerMode, showHeader, hideHeader]);

  // 초기 헤더 상태 설정
  useEffect(() => {
    if (headerMode === 'fixed') {
      showHeader();
    } else if (headerMode === 'hidden') {
      hideHeader();
    }
  }, [headerMode, showHeader, hideHeader]);

  // 마우스 이벤트 핸들러 (auto 모드에서만 호버 동작)
  const handleMouseEnter = useCallback(() => {
    setIsHeaderHovered(true);
    if (headerMode === 'auto') {
      showHeader();
    }
  }, [showHeader, headerMode]);

  const handleMouseLeave = useCallback(() => {
    setIsHeaderHovered(false);
    if (headerMode === 'auto') {
      hideHeader();
    }
  }, [hideHeader, headerMode]);

  // 이벤트 핸들러들
  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/");
  }, [logout, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    const success = await loginWithGoogle();
    if (success) {
      navigate("/recommendations");
    }
  }, [loginWithGoogle, navigate]);

  const handleProfileMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  }, []);

  const handleProfileMenuClose = useCallback(() => {
    setProfileMenuAnchor(null);
  }, []);

  const handleProfileMenuAction = useCallback((action: string) => {
    handleProfileMenuClose();
    switch (action) {
      case 'profile':
        navigate('/me');
        break;
      case 'logout':
        handleLogout();
        break;
    }
  }, [navigate, handleLogout, handleProfileMenuClose]);

  const handleLogoClick = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleMenuClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  return (
    <>
    {/* 상단 호버 핫존: 높이 16px, 화면 가득. 헤더가 숨겨져 있어도 호버로 표시 트리거 */}
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "16px",
        zIndex: 1101,
        pointerEvents: "auto",
      }}
      onMouseEnter={handleMouseEnter}
    />
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: `translateX(-50%) translateY(${isHeaderVisible ? '10px' : '-100px'})`,
        zIndex: 1100,
        width: "calc(100vw - 80px)",
        maxWidth: "calc(100vw - 80px)",
        transition: "transform 0.3s ease-in-out",
        pointerEvents: isHeaderVisible ? "auto" : "none",
      }}
    >
      <Box
        component="header"
        sx={{
          background: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "100%",
          minWidth: "300px",
          maxWidth: { xs: "100%", sm: "600px", md: "800px", lg: "1000px" },
          transition: "all 0.3s ease",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: { xs: "12px 16px", sm: "16px 20px" },
            height: "60px",
          }}
        >
          {/* 로고 */}
          <Box
            component="button"
            onClick={handleLogoClick}
            sx={{
              ...styles.baseButton,
              padding: "0",
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
              justifyContent: "flex-start",
              height: "100%",
              outline: "none",
            visibility: isLandingPage ? 'hidden' : 'visible',
              pointerEvents: isLandingPage ? 'none' : 'auto',
              "&:focus": {
                outline: "none",
                boxShadow: "none",
              },
              "&:focus-visible": {
                outline: "none",
                boxShadow: "none",
              },
              "&:hover": {
                backgroundColor: "transparent",
              },
            }}
          >
            <Box
              component="img"
              src="/assets/images/orakgrak_logo.png"
              alt="오락가락 로고"
              sx={{
                width: 40,
                height: 40,
                objectFit: "contain",
                filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                transition: "all 0.3s ease",
                transform: 'scale(2.5)',
                transformOrigin: 'center',
                pointerEvents: 'none',
                marginLeft: '-120px'
              }}
            />
        </Box>

        {/* 네비게이션 메뉴 */}
        <Box
          component="nav"
          sx={{
            display: { xs: "none", md: "flex" },
              gap: 0.5,
          }}
        >
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
            <Button
              key={item.path}
                  onClick={() => handleMenuClick(item.path)}
              sx={{
                    ...styles.baseButton,
                    padding: "6px 12px",
                    backgroundColor: "transparent",
                position: "relative",
                    color: isActive ? "#FFD700" : "#ffffff",
                    fontWeight: isActive ? 700 : 500,
                    textShadow: isActive ? "2px 2px 4px rgba(0, 0, 0, 0.3)" : "none",
                    transform: isActive ? "translateY(-1px)" : "translateY(0)",
                    transition: "all 0.3s ease",
                    outline: "none",
                    "&:focus": {
                      outline: "none",
                    },
                    "&:hover": {
                      color: "#FFD700",
                      textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                      transform: "translateY(-1px)",
                    },
              }}
            >
              {item.label}
              {item.label === "AI 데모" && (
                <Box
                  component="span"
                  sx={{
                    position: "absolute",
                        top: "-8px",
                        right: "2px",
                    fontSize: "8px",
                        fontWeight: 600,
                    color: "#ff6b6b",
                        padding: "1px 4px",
                        borderRadius: "4px",
                  }}
                >
                  beta
                </Box>
              )}
            </Button>
              );
            })}
        </Box>

        {/* 사용자 영역 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {isAuthenticated ? (
            <>
              <Button
                  onClick={handleProfileMenuOpen}
                sx={{
                    ...styles.baseButton,
                    padding: "6px 10px",
                  backgroundColor: "transparent",
                    border: "1px solid rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Avatar
                  src={user?.profileImageUrl || user?.profileImage}
                    sx={{ width: 24, height: 24 }}
                  >
                    <Person sx={{ fontSize: "14px", color: "#ffffff" }} />
                </Avatar>
                <Typography
                  component="span"
                  sx={{
                      color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {user?.nickname || "닉네임 설정"}
                </Typography>
              </Button>

                <Menu
                  anchorEl={profileMenuAnchor}
                  open={profileMenuOpen}
                  onClose={handleProfileMenuClose}
                  TransitionComponent={Fade}
                  PaperProps={{
                    sx: {
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
                      mt: 1,
                      minWidth: 160,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem
                    onClick={() => handleProfileMenuAction('profile')}
                    sx={{
                      color: "#ffffff",
                      fontSize: "14px",
                      py: 1,
                      px: 2,
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    <AccountCircle sx={{ mr: 1.5, fontSize: "18px", color: "#ffffff" }} />
                    마이페이지
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleProfileMenuAction('logout')}
                    sx={{
                      color: "#ff6b6b",
                      fontSize: "14px",
                      py: 1,
                      px: 2,
                      "&:hover": {
                        backgroundColor: "rgba(255, 107, 107, 0.1)",
                      },
                    }}
                  >
                    <Logout sx={{ mr: 1.5, fontSize: "18px", color: "#ff6b6b" }} />
                    로그아웃
                  </MenuItem>
                </Menu>
            </>
          ) : (
            <Button
              onClick={handleGoogleLogin}
              disabled={isSocialLoading}
                sx={styles.authButton}
            >
              {isSocialLoading ? "로그인 중..." : "구글 로그인"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
    </Box>
    </>
  );
};

export default Header;