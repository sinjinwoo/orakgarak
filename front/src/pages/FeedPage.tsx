import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";
import { albumService } from "../services/api/albums";
import { motion } from "framer-motion";
import {
  FeedAlbum,
  getMyAlbums,
  getFeedAlbums,
  clearDummyAlbums,
} from "../utils/feedUtils";
import {
  getErrorMessage as getApiErrorMessage,
  logError,
  isRetryableError,
} from "../utils/errorHandler";
import { API_CONSTANTS, WARNING_MESSAGES } from "../utils/constants";
import {
  Container,
  Typography,
  Box,
  Paper,
  CardMedia,
  Avatar,
  Chip,
  Button,
  TextField,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { FilterList, Add, MusicNote, Person } from "@mui/icons-material";

// 앨범 만들기 페이지와 동일한 스타일 정의
const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes pulseGlow {
      0% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
      100% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
    }
    @keyframes neonFlicker {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.9; }
    }
    @keyframes cyberGlow {
      0% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.4), 0 0 50px rgba(6, 182, 212, 0.3); }
      100% { box-shadow: 0 0 40px rgba(236, 72, 153, 0.6), 0 0 70px rgba(6, 182, 212, 0.4); }
    }
    @keyframes brightPulse {
      0%, 100% { filter: brightness(1) saturate(1); }
      50% { filter: brightness(1.2) saturate(1.3); }
    }
  `;

const FeedPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [sortBy, setSortBy] = useState("latest");
  const [feedAlbums, setFeedAlbums] = useState<FeedAlbum[]>([]);
  const [myAlbums, setMyAlbums] = useState(getMyAlbums());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [createFeedModalOpen, setCreateFeedModalOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [feedDescription, setFeedDescription] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // API로 공개 앨범 데이터 로드
  const loadPublicAlbums = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      const response = await albumService.getPublicAlbums({
        page: pageNum,
        size: API_CONSTANTS.DEFAULT_PAGE_SIZE,
      });
      const albums = response.content || [];
      const mappedAlbums: FeedAlbum[] = albums.map((album) => ({
        ...album,
        user: {
          nickname: album.userNickname || `사용자 ${album.userId}`,
          avatar:
            album.userProfileImageUrl ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        },
        tags: ["캐주얼", "힐링"],
        playCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 50),
      }));

      if (append) {
        setFeedAlbums(prev => [...prev, ...mappedAlbums]);
      } else {
        setFeedAlbums(mappedAlbums);
      }

      // 더 이상 로드할 데이터가 있는지 확인
      setHasMore(albums.length === API_CONSTANTS.DEFAULT_PAGE_SIZE);
    } catch (error) {
      logError(error, "공개 앨범 로드");
      const errorMessage = getApiErrorMessage(error);
      setError(errorMessage);

      // 에러 시 localStorage 데이터로 폴백 (첫 페이지만)
      if (!append) {
        setFeedAlbums(getFeedAlbums());
      }

      // 재시도 가능한 에러인 경우 사용자에게 알림
      if (isRetryableError(error)) {
        showToast(WARNING_MESSAGES.NETWORK_RETRY, "warning");
      }
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [showToast]);

  // 팔로우한 사용자들의 앨범 로드
  const loadFollowedUsersAlbums = useCallback(async (pageNum = 0, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      const response = await albumService.getFollowedUsersAlbums({
        page: pageNum,
        size: API_CONSTANTS.DEFAULT_PAGE_SIZE,
      });
      const albums = response.content || [];
      const mappedAlbums: FeedAlbum[] = albums.map((album) => ({
        ...album,
        user: {
          nickname: album.userNickname || `사용자 ${album.userId}`,
          avatar:
            album.userProfileImageUrl ||
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        },
        tags: ["커버", "감성"],
        playCount: Math.floor(Math.random() * 1000),
        commentCount: Math.floor(Math.random() * 50),
      }));

      if (append) {
        setFeedAlbums(prev => [...prev, ...mappedAlbums]);
      } else {
        setFeedAlbums(mappedAlbums);
      }

      // 더 이상 로드할 데이터가 있는지 확인
      setHasMore(albums.length === API_CONSTANTS.DEFAULT_PAGE_SIZE);
    } catch (error) {
      logError(error, "팔로우 사용자 앨범 로드");
      const errorMessage = getApiErrorMessage(error);
      setError(errorMessage);

      // 재시도 가능한 에러인 경우 사용자에게 알림
      if (isRetryableError(error)) {
        showToast(WARNING_MESSAGES.DATA_LOAD_FAILED, "warning");
      }
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [showToast]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    // 더미 데이터 제거
    clearDummyAlbums();

    loadPublicAlbums();
    setMyAlbums(getMyAlbums());
  }, [loadPublicAlbums]);

  useEffect(() => {
    // 탭 변경 시 페이지 상태 리셋
    setPage(0);
    setHasMore(true);
    if (tabValue === 0) {
      loadPublicAlbums(0, false);
    } else {
      loadFollowedUsersAlbums(0, false);
    }
  }, [tabValue, loadPublicAlbums, loadFollowedUsersAlbums]);

  // 무한 스크롤 구현
  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

      // 스크롤이 바닥에서 100px 위에 도달했을 때 더 로드
      if (scrollTop + clientHeight >= scrollHeight - 100 && hasMore && !isLoadingMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);

        if (tabValue === 0) {
          loadPublicAlbums(nextPage, true);
        } else {
          loadFollowedUsersAlbums(nextPage, true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, isLoadingMore, loading, tabValue, loadPublicAlbums, loadFollowedUsersAlbums]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    []
  );

  const filteredFeedAlbums = useMemo(() => feedAlbums, [feedAlbums]);

  const handleSortChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSortBy(event.target.value as string);
    },
    []
  );

  const handleAlbumClick = (feed: FeedAlbum) => {
    navigate(`/albums/${feed.id}`, { state: { from: "/feed" } });
  };

  const handleCreateFeed = () => {
    const latestMyAlbums = getMyAlbums();
    setMyAlbums(latestMyAlbums);
    if (latestMyAlbums.length === 0) {
      showToast("먼저 앨범을 생성해주세요.", "info");
      return;
    }
    setCreateFeedModalOpen(true);
  };

  const handleCloseCreateFeedModal = () => {
    setCreateFeedModalOpen(false);
    setSelectedAlbumId("");
    setFeedDescription("");
  };

  const handleFeedSubmit = () => {
    if (!selectedAlbumId || !feedDescription.trim()) {
      showToast("앨범을 선택하고 설명을 입력해주세요.", "warning");
      return;
    }

    const selectedAlbum = myAlbums.find(
      (album: FeedAlbum) => album.id.toString() === selectedAlbumId
    );
    if (!selectedAlbum) {
      showToast("선택된 앨범을 찾을 수 없습니다.", "error");
      return;
    }

    const newFeed: FeedAlbum = {
      id: selectedAlbum.id,
      userId: selectedAlbum.userId,
      title: selectedAlbum.title,
      description: feedDescription,
      coverImageUrl: selectedAlbum.coverImageUrl,
      isPublic: selectedAlbum.isPublic,
      trackCount: selectedAlbum.trackCount,
      totalDuration: selectedAlbum.totalDuration,
      likeCount: 0,
      playCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        nickname: user?.nickname || "사용자",
        avatar:
          user?.profileImageUrl ||
          user?.profileImage ||
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      },
      tags: selectedAlbum.tags || [],
    };
    setFeedAlbums((prev: FeedAlbum[]) => {
      const updatedFeedAlbums = [newFeed, ...prev];
      localStorage.setItem("feedAlbums", JSON.stringify(updatedFeedAlbums));
      return updatedFeedAlbums;
    });
    handleCloseCreateFeedModal();
    showToast("피드가 성공적으로 생성되었습니다!", "success");
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 80%),
          radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
          linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
        `,
      color: '#fff',
      paddingTop: '100px',
      overflowX: 'hidden',
    }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          opacity: isInitialized ? 1 : 0,
          transform: isInitialized ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.6s ease",
        }}
      >

        <Container
          maxWidth="lg"
          sx={{ py: 3, position: "relative", zIndex: 1 }}
        >
          <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Paper
                sx={{
                  p: 4,
                  borderRadius: "15px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "4px solid rgba(236, 72, 153, 0.8)",
                  boxShadow: "0 0 50px rgba(236, 72, 153, 0.7), inset 0 0 50px rgba(6, 182, 212, 0.4)",
                  backdropFilter: "blur(15px)",
                }}
              >
                <Box sx={{ mb: 4 }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    centered
                    sx={{
                      mb: 4,
                      borderBottom: 1,
                      borderColor: "rgba(0, 255, 255, 0.2)",
                      "& .MuiTabs-indicator": {
                        background: "linear-gradient(45deg, #00ffff, #ff0080)",
                        height: 3,
                        borderRadius: "3px 3px 0 0",
                        boxShadow: "0 0 10px rgba(0, 255, 255, 0.5)",
                      },
                    }}
                  >
                    <Tab
                      label="전체 피드"
                      sx={{
                        color: "#B3B3B3",
                        "&.Mui-selected": { color: "#FFFFFF" },
                      }}
                    />
                    <Tab
                      label="팔로잉"
                      sx={{
                        color: "#B3B3B3",
                        "&.Mui-selected": { color: "#FFFFFF" },
                      }}
                    />
                  </Tabs>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{ color: "#00ffff", fontWeight: 500 }}
                    >
                      {feedAlbums.length}개 앨범
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <FilterList sx={{ color: "#00ffff" }} />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={sortBy}
                          onChange={handleSortChange}
                          displayEmpty
                          sx={{
                            borderRadius: 2,
                            backgroundColor: "rgba(0, 255, 255, 0.05)",
                            color: "#FFFFFF",
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(0, 255, 255, 0.3)",
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(0, 255, 255, 0.5)",
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(0, 255, 255, 0.7)",
                            },
                            "& .MuiSvgIcon-root": { color: "#00ffff" },
                          }}
                        >
                          <MenuItem value="latest">최신순</MenuItem>
                          <MenuItem value="popular">인기순</MenuItem>
                          <MenuItem value="trending">트렌딩</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateFeed}
                        sx={{
                          background:
                            "linear-gradient(45deg, #00ffff, #ff0080)",
                          color: "#000000",
                          fontWeight: "bold",
                          boxShadow: "0 0 15px rgba(0, 255, 255, 0.4)",
                          "&:hover": {
                            boxShadow: "0 0 25px rgba(0, 255, 255, 0.7)",
                          },
                        }}
                      >
                        내 피드 만들기
                      </Button>
                    </Box>
                  </Box>
                </Box>

                {error && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      px: 3,
                      mb: 3,
                      backgroundColor: "rgba(255, 0, 0, 0.1)",
                      border: "1px solid rgba(255, 0, 0, 0.3)",
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "#FF6B6B", mb: 1 }}>
                      데이터를 불러오는데 실패했습니다
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
                    >
                      서버에 일시적인 문제가 있을 수 있습니다.
                    </Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() =>
                        tabValue === 0
                          ? loadPublicAlbums()
                          : loadFollowedUsersAlbums()
                      }
                      sx={{ mt: 1 }}
                    >
                      다시 시도
                    </Button>
                  </Box>
                )}

                {loading && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      앨범을 불러오는 중...
                    </Typography>
                  </Box>
                )}

                {!loading && !error && filteredFeedAlbums.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                      color: "#B3B3B3",
                    }}
                  >
                    <Typography variant="h5" sx={{ mb: 2, color: "#FFFFFF" }}>
                      {tabValue === 0
                        ? "아직 피드에 올라온 앨범이 없습니다"
                        : "팔로잉한 사용자의 피드가 없습니다"}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4 }}>
                      {tabValue === 0
                        ? "첫 번째 앨범을 피드에 올려보세요!"
                        : "다른 사용자를 팔로우하거나 앨범을 만들어보세요"}
                    </Typography>
                    {tabValue === 0 && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateFeed}
                        sx={{
                          background:
                            "linear-gradient(45deg, #00ffff, #ff0080)",
                          color: "#FFFFFF",
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: "0 4px 15px rgba(0, 255, 255, 0.4)",
                          "&:hover": {
                            background:
                              "linear-gradient(135deg, #00ffff, #ff0080)",
                            boxShadow: "0 6px 20px rgba(0, 255, 255, 0.6)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        앨범 피드 올리기
                      </Button>
                    )}
                  </Box>
                ) : (
                  !loading &&
                  !error && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        maxWidth: "800px",
                        margin: "0 auto",
                      }}
                    >
                      {filteredFeedAlbums.map(
                        (album: FeedAlbum, index: number) => (
                          <motion.div
                            key={
                              album.id ? `album-${album.id}` : `album-${index}`
                            }
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          >
                            <Box
                              sx={{
                                position: "relative",
                                cursor: "pointer",
                                overflow: "hidden",
                                borderRadius: 2,
                                backgroundColor: "rgba(255, 255, 255, 0.05)",
                                backdropFilter: "blur(10px)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                transition: "all 0.3s ease",
                                display: "grid",
                                gridTemplateColumns: "500px 1fr",
                                width: "100%",
                                minHeight: "500px",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
                                },
                              }}
                              onClick={() => handleAlbumClick(album)}
                            >
                              <Box
                                sx={{
                                  position: "relative",
                                  width: "100%",
                                  height: "100%",
                                  overflow: "hidden",
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {album.coverImageUrl ? (
                                  <CardMedia
                                    component="img"
                                    sx={{
                                      width: "450px",
                                      height: "450px",
                                      objectFit: "cover",
                                      borderRadius: 2,
                                      transition: "all 0.3s ease",
                                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
                                    }}
                                    image={album.coverImageUrl}
                                    alt={album.title}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: "450px",
                                      height: "450px",
                                      background: "linear-gradient(135deg, #00ffff, #ff0080)",
                                      borderRadius: 2,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
                                    }}
                                  >
                                    <MusicNote
                                      sx={{
                                        fontSize: "8rem",
                                        color: "rgba(255, 255, 255, 0.9)",
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>

                              <Box
                                sx={{
                                  p: 4,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  height: "100%",
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="h3"
                                    sx={{
                                      fontWeight: 800,
                                      color: "#FFFFFF",
                                      fontSize: "2.5rem",
                                      mb: 3,
                                      lineHeight: 1.1,
                                    }}
                                  >
                                    {album.title || "제목 없음"}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mb: 4,
                                    }}
                                  >
                                    <Avatar
                                      src={album.user?.avatar}
                                      sx={{
                                        width: 50,
                                        height: 50,
                                        mr: 3,
                                        border: "3px solid rgba(255, 255, 255, 0.3)",
                                      }}
                                    >
                                      <Person sx={{ fontSize: 28 }} />
                                    </Avatar>
                                    <Typography
                                      variant="h4"
                                      sx={{
                                        fontSize: "1.8rem",
                                        color: "rgba(255, 255, 255, 0.9)",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {album.user?.nickname || `사용자 ${album.userId}`}
                                    </Typography>
                                  </Box>

                                  <Typography
                                    variant="h6"
                                    sx={{
                                      color: "rgba(255, 255, 255, 0.8)",
                                      lineHeight: 1.6,
                                      fontSize: "1.3rem",
                                      mb: 4,
                                      fontWeight: 400,
                                    }}
                                  >
                                    {album.description || "이 앨범에 대한 설명이 아직 작성되지 않았습니다."}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                      mb: 3,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Typography
                                      variant="h5"
                                      sx={{
                                        fontSize: "1.5rem",
                                        color: "rgba(255, 255, 255, 0.9)",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        fontWeight: 700,
                                      }}
                                    >
                                      ♫ {album.trackCount || 0}곡
                                    </Typography>
                                    {album.totalDuration > 0 && (
                                      <Typography
                                        variant="h5"
                                        sx={{
                                          fontSize: "1.5rem",
                                          color: "rgba(255, 255, 255, 0.9)",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                          fontWeight: 700,
                                        }}
                                      >
                                        ⏱ {Math.floor((album.totalDuration || 0) / 60)}분
                                      </Typography>
                                    )}
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        fontSize: "1.2rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {album.createdAt
                                        ? new Date(album.createdAt).toLocaleDateString("ko-KR")
                                        : "날짜 없음"}
                                    </Typography>
                                  </Box>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 1.5,
                                    }}
                                  >
                                    {(album.tags || []).map((tag: string) => (
                                      <Chip
                                        key={tag}
                                        label={tag}
                                        sx={{
                                          backgroundColor: "rgba(0, 255, 255, 0.25)",
                                          color: "#00ffff",
                                          fontSize: "1.1rem",
                                          height: "45px",
                                          fontWeight: 700,
                                          border: "2px solid rgba(0, 255, 255, 0.5)",
                                          px: 2,
                                          "&:hover": {
                                            backgroundColor: "rgba(0, 255, 255, 0.35)",
                                            transform: "translateY(-1px)",
                                          },
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          </motion.div>
                        )
                      )}
                    </Box>
                  )
                )}

                {isLoadingMore && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      mt: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      더 많은 앨범을 불러오는 중...
                    </Typography>
                  </Box>
                )}

                {!hasMore && filteredFeedAlbums.length > 0 && !loading && (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      mt: 2,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.5)" }}
                    >
                      모든 앨범을 확인했습니다
                    </Typography>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Box>
        </Container>

        <Dialog
          open={createFeedModalOpen}
          onClose={handleCloseCreateFeedModal}
          maxWidth="md"
          fullWidth
          sx={{
            "& .MuiDialog-paper": {
              borderRadius: 3,
              maxHeight: "90vh",
              background: "rgba(15, 15, 15, 0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(196, 71, 233, 0.3)",
              boxShadow: "0 0 40px rgba(196, 71, 233, 0.3)",
            },
          }}
        >
          <DialogTitle
            sx={{
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#FFFFFF",
              pb: 2,
              background:
                "linear-gradient(135deg, #FF6B9D 0%, #C147E9 50%, #8B5CF6 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 20px rgba(196, 71, 233, 0.5)",
            }}
          >
            내 피드 만들기
          </DialogTitle>

          <DialogContent sx={{ px: 4, py: 2 }}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "#FFFFFF",
                }}
              >
                공유할 앨범 선택
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#B3B3B3",
                  mb: 2,
                  fontSize: "0.9rem",
                }}
              >
                공유하고 싶은 앨범을 하나 선택해주세요
              </Typography>

              <FormControl component="fieldset">
                {myAlbums.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      color: "#B3B3B3",
                    }}
                  >
                    <MusicNote sx={{ fontSize: 48, color: "#C147E9", mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, color: "#FFFFFF" }}>
                      생성된 앨범이 없습니다
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ mb: 3, color: "#B3B3B3" }}
                    >
                      먼저 앨범을 생성한 후 피드로 공유해보세요
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => {
                        handleCloseCreateFeedModal();
                        navigate("/albums/create");
                      }}
                      sx={{
                        background:
                          "linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)",
                        color: "#FFFFFF",
                        px: 3,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "0 4px 15px rgba(196, 71, 233, 0.4)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)",
                          boxShadow: "0 6px 20px rgba(196, 71, 233, 0.6)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      앨범 만들기
                    </Button>
                  </Box>
                ) : (
                  <RadioGroup
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                  >
                    {myAlbums.map((album: FeedAlbum) => (
                      <FormControlLabel
                        key={album.id}
                        value={album.id.toString()}
                        control={
                          <Radio
                            sx={{
                              color: "#C147E9",
                              "&.Mui-checked": {
                                color: "#C147E9",
                              },
                            }}
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              p: 2,
                              border:
                                selectedAlbumId === album.id.toString()
                                  ? "2px solid rgba(196, 71, 233, 0.5)"
                                  : "1px solid rgba(255, 255, 255, 0.2)",
                              borderRadius: 2,
                              ml: 1,
                              width: "100%",
                              backgroundColor:
                                selectedAlbumId === album.id.toString()
                                  ? "rgba(196, 71, 233, 0.1)"
                                  : "rgba(255, 255, 255, 0.05)",
                              backdropFilter: "blur(10px)",
                              transition: "all 0.3s ease-in-out",
                              boxShadow:
                                selectedAlbumId === album.id.toString()
                                  ? "0 0 20px rgba(196, 71, 233, 0.3)"
                                  : "none",
                              "&:hover": {
                                backgroundColor: "rgba(196, 71, 233, 0.1)",
                                borderColor: "rgba(196, 71, 233, 0.3)",
                                boxShadow: "0 0 15px rgba(196, 71, 233, 0.2)",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: 1,
                                mr: 2,
                                border: "2px solid rgba(196, 71, 233, 0.3)",
                                boxShadow: "0 0 10px rgba(196, 71, 233, 0.3)",
                                position: "relative",
                                overflow: "hidden",
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                              }}
                            >
                              {album.coverImageUrl ? (
                                <CardMedia
                                  component="img"
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                  image={album.coverImageUrl}
                                  alt={album.title}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                              ) : null}
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 0,
                                  left: 0,
                                  width: "100%",
                                  height: "100%",
                                  background: album.coverImageUrl
                                    ? "none"
                                    : "linear-gradient(135deg, #FF6B9D 0%, #C147E9 50%, #8B5CF6 100%)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  zIndex: album.coverImageUrl ? -1 : 1,
                                }}
                              >
                                {!album.coverImageUrl && (
                                  <MusicNote
                                    sx={{
                                      fontSize: "2rem",
                                      color: "rgba(255, 255, 255, 0.8)",
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 600,
                                  mb: 1,
                                  color: "#FFFFFF",
                                }}
                              >
                                {album.title || "제목 없음"}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#B3B3B3" }}
                                >
                                  {album.trackCount || 0}곡
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#B3B3B3" }}
                                >
                                  {album.totalDuration
                                    ? `${Math.floor(
                                        album.totalDuration / 60
                                      )}분`
                                    : "0분"}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  flexWrap: "wrap",
                                }}
                              >
                                {(album.tags || []).map((tag: string) => (
                                  <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                      backgroundColor:
                                        "rgba(196, 71, 233, 0.1)",
                                      color: "#C147E9",
                                      fontSize: "0.75rem",
                                      height: 24,
                                      border:
                                        "1px solid rgba(196, 71, 233, 0.3)",
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        }
                        sx={{ width: "100%", m: 0 }}
                      />
                    ))}
                  </RadioGroup>
                )}
              </FormControl>
            </Box>

            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  mb: 1,
                  color: "#FFFFFF",
                }}
              >
                피드 설명 작성
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#B3B3B3",
                  mb: 2,
                  fontSize: "0.9rem",
                }}
              >
                이 앨범에 대한 이야기나 감상을 자유롭게 작성해주세요. 이 내용이
                피드에 표시됩니다.
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="이 앨범에 대한 이야기를 공유해보세요..."
                value={feedDescription}
                onChange={(e) => setFeedDescription(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "#FFFFFF",
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(196, 71, 233, 0.3)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(196, 71, 233, 0.5)",
                      boxShadow: "0 0 10px rgba(196, 71, 233, 0.3)",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#FFFFFF",
                    "&::placeholder": {
                      color: "#737373",
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 4, pb: 3, gap: 2 }}>
            <Button
              onClick={handleCloseCreateFeedModal}
              sx={{
                color: "#B3B3B3",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  color: "#FFFFFF",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleFeedSubmit}
              variant="contained"
              disabled={!selectedAlbumId || !feedDescription.trim()}
              sx={{
                background:
                  selectedAlbumId && feedDescription.trim()
                    ? "linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)"
                    : "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                borderRadius: 2,
                px: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 600,
                boxShadow:
                  selectedAlbumId && feedDescription.trim()
                    ? "0 4px 15px rgba(196, 71, 233, 0.4)"
                    : "none",
                "&:hover": {
                  background:
                    selectedAlbumId && feedDescription.trim()
                      ? "linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)"
                      : "rgba(255, 255, 255, 0.1)",
                  boxShadow:
                    selectedAlbumId && feedDescription.trim()
                      ? "0 6px 20px rgba(196, 71, 233, 0.6)"
                      : "none",
                  transform:
                    selectedAlbumId && feedDescription.trim()
                      ? "translateY(-2px)"
                      : "none",
                },
                "&:disabled": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "#737373",
                  boxShadow: "none",
                },
              }}
            >
              피드 공유하기
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default FeedPage;
