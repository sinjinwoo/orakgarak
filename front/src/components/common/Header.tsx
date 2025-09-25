import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Typography, Button, Box, Avatar, Menu, MenuItem, Fade } from "@mui/material";
import { Person, Logout, Settings, AccountCircle } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useSocialAuth } from "../../hooks/useAuth";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { loginWithGoogle, isLoading } = useSocialAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const profileMenuOpen = Boolean(profileMenuAnchor);

  const isLandingPage = location.pathname === "/";

  // 메뉴 아이템 메모이제이션
  const menuItems = useMemo(() => [
    { label: "추천", path: "/recommendations" },
    { label: "녹음", path: "/record" },
    { label: "피드", path: "/feed" },
    { label: "앨범 만들기", path: "/albums/create" },
    { label: "AI 데모", path: "/ai-demo" },
  ], []);

  // 스타일 객체 메모이제이션 - 어두운 배경에 맞게 조정
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

  // auto-hide 스크롤 이벤트 - 모든 페이지에서 작동
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 스크롤 위치에 따른 배경 투명도 조정
      const shouldScroll = currentScrollY > 50;
      setIsScrolled(prev => prev !== shouldScroll ? shouldScroll : prev);
      
      // auto-hide: 스크롤하면 헤더 숨김, 최상단이면 헤더 표시
      if (currentScrollY > 100) {
        // 100px 이상 스크롤된 경우 헤더 숨김
        setIsHeaderVisible(false);
      } else {
        // 최상단 근처(100px 이하)에 있는 경우 헤더 표시
        setIsHeaderVisible(true);
      }
    };

    // 초기 상태 설정
    handleScroll();
    
    // 스크롤 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // 빈 dependency 배열로 안정화

  // 이벤트 핸들러들 메모이제이션
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
      case 'settings':
        navigate('/settings');
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

  // 동적 배경 스타일 계산 - 페이지 배경에 맞게 조화롭게
  const headerBackground = useMemo(() => {
    if (!isLandingPage) return "rgba(0, 0, 0, 0.3)";
    return isScrolled ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.2)";
  }, [isLandingPage, isScrolled]);

  return (
      <Box
        sx={{
          position: "fixed",
          // transform을 사용하여 더 부드러운 애니메이션
          top: 15,
          left: "50%",
          transform: `translateX(-50%) translateY(${isHeaderVisible ? '0' : '-150px'})`,
          zIndex: 1100,
          width: "100%",
          maxWidth: "calc(100vw - 80px)",
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          px: { xs: 2, sm: 3, md: 4 },
          // 부드러운 애니메이션 효과 개선
          transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
      <Box
        component="header"
        sx={{
          position: "relative",
          background: headerBackground,
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          boxShadow: isScrolled 
            ? "0 8px 32px rgba(0, 0, 0, 0.15)" 
            : "0 4px 20px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: "100%",
          minWidth: "300px",
          maxWidth: { xs: "100%", sm: "600px", md: "800px", lg: "1000px" },
          pointerEvents: "auto",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* 로고 (랜딩 페이지에서는 공간은 유지, 버튼은 숨김) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: { xs: "12px 16px", sm: "16px 20px" },
            width: "100%",
            height: "60px", // navbar 높이 고정
            minHeight: "60px", // 최소 높이 보장
            maxHeight: "60px", // 최대 높이 제한
          }}
        >
          {/* 로고 */}
          <Box
            component="button"
            onClick={handleLogoClick}
            sx={{
              ...styles.baseButton,
              padding: "0", // 패딩 제거로 로고가 navbar 높이를 넘지 않도록
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-start", // 좌측 정렬로 변경
              height: "100%", // navbar 높이에 맞춤
              outline: "none",
              visibility: isLandingPage ? 'hidden' : 'visible',
              pointerEvents: isLandingPage ? 'none' : 'auto',
              "&:focus": {
                outline: "none",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                transform: "translateY(-1px)",
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
                 filter:
                   isLandingPage && !isScrolled
                     ? "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
                     : "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))",
                 transition: "all 0.3s ease",
                 // 레이아웃 높이는 유지하고 시각적으로만 확대
                 transform: 'scale(2.5)',
                 transformOrigin: 'center',
                 pointerEvents: 'none',
                 marginLeft: '-120px' // 더 좌측으로 이동
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
                       boxShadow: isActive ? "0 4px 8px rgba(255, 215, 0, 0.3)" : "none",
                       transition: "all 0.3s ease",
                       outline: "none",
                       "&:focus": {
                         outline: "none",
                       },
                       "&:hover": {
                         color: "#FFD700",
                         textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
                         transform: "translateY(-1px)",
                         boxShadow: "0 4px 8px rgba(255, 215, 0, 0.3)",
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
                    {user?.nickname || "사용자"}
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
                    onClick={() => handleProfileMenuAction('settings')}
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
                    <Settings sx={{ mr: 1.5, fontSize: "18px", color: "#ffffff" }} />
                    설정
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
                disabled={isLoading}
                sx={styles.authButton}
              >
                {isLoading ? "로그인 중..." : "구글 로그인"}
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;