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
  Button,
  SelectChangeEvent,
} from "@mui/material";
import { MusicNote, Person } from "@mui/icons-material";
import FeedTabs from "../components/feed/FeedTabs";

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

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // API로 공개 앨범 데이터 로드
  const loadPublicAlbums = useCallback(
    async (pageNum = 0, append = false) => {
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
          playCount: Math.floor(Math.random() * 1000),
          commentCount: Math.floor(Math.random() * 50),
        }));

        if (append) {
          setFeedAlbums((prev) => [...prev, ...mappedAlbums]);
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
    },
    [showToast]
  );

  // 팔로우한 사용자들의 앨범 로드
  const loadFollowedUsersAlbums = useCallback(
    async (pageNum = 0, append = false) => {
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
          playCount: Math.floor(Math.random() * 1000),
          commentCount: Math.floor(Math.random() * 50),
        }));

        if (append) {
          setFeedAlbums((prev) => [...prev, ...mappedAlbums]);
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
    },
    [showToast]
  );

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
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;

      // 스크롤이 바닥에서 100px 위에 도달했을 때 더 로드
      if (
        scrollTop + clientHeight >= scrollHeight - 100 &&
        hasMore &&
        !isLoadingMore &&
        !loading
      ) {
        const nextPage = page + 1;
        setPage(nextPage);

        if (tabValue === 0) {
          loadPublicAlbums(nextPage, true);
        } else {
          loadFollowedUsersAlbums(nextPage, true);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    page,
    hasMore,
    isLoadingMore,
    loading,
    tabValue,
    loadPublicAlbums,
    loadFollowedUsersAlbums,
  ]);

  const handleTabChange = useCallback(
    (_event: React.SyntheticEvent, newValue: number) => {
      setTabValue(newValue);
    },
    []
  );

  const filteredFeedAlbums = useMemo(() => {
    const sorted = [...feedAlbums].sort((a, b) => {
      if (sortBy === "latest") {
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      }
      if (sortBy === "name") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "likeCount") {
        return (b.likeCount || 0) - (a.likeCount || 0);
      }
      return 0;
    });
    return sorted;
  }, [feedAlbums, sortBy]);

  const handleSortChange = useCallback((event: SelectChangeEvent<string>) => {
    setSortBy(event.target.value as string);
  }, []);

  const handleAlbumClick = (feed: FeedAlbum) => {
    navigate(`/albums/${feed.id}`, { state: { from: "/feed" } });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.25) 0%, transparent 60%),
          radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 80%),
          radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
          linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 70%, #1a1a2e 100%)
        `,
        color: "#fff",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />

      <FeedTabs
        tabValue={tabValue}
        onTabChange={handleTabChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        albumCount={feedAlbums.length}
        isInitialized={isInitialized}
      />

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
                  boxShadow:
                    "0 0 50px rgba(236, 72, 153, 0.7), inset 0 0 50px rgba(6, 182, 212, 0.4)",
                  backdropFilter: "blur(15px)",
                }}
              >
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
                  </Box>
                ) : (
                  !loading &&
                  !error && (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 3,
                        maxWidth: "1200px",
                        margin: "0 auto",
                        "@media (max-width: 900px)": {
                          gridTemplateColumns: "1fr",
                        },
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
                            transition={{
                              duration: 0.5,
                              delay: (index % 2) * 0.1,
                            }}
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
                                display: "flex",
                                flexDirection: "row",
                                width: "100%",
                                minHeight: "280px",
                                "&:hover": {
                                  transform: "translateY(-2px)",
                                  backgroundColor:
                                    "rgba(255, 255, 255, 0.08)",
                                  boxShadow:
                                    "0 8px 25px rgba(0, 0, 0, 0.3)",
                                },
                                "@media (max-width: 600px)": {
                                  flexDirection: "column",
                                  minHeight: "400px",
                                },
                              }}
                              onClick={() => handleAlbumClick(album)}
                            >
                              <Box
                                sx={{
                                  position: "relative",
                                  width: "40%",
                                  height: "100%",
                                  overflow: "hidden",
                                  backgroundColor: "rgba(0, 0, 0, 0.2)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  p: 2,
                                  "@media (max-width: 600px)": {
                                    width: "100%",
                                    height: "250px",
                                  },
                                }}
                              >
                                {album.coverImageUrl ? (
                                  <CardMedia
                                    component="img"
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      borderRadius: 1,
                                      transition: "all 0.3s ease",
                                      boxShadow:
                                        "0 4px 20px rgba(0, 0, 0, 0.4)",
                                    }}
                                    image={album.coverImageUrl}
                                    alt={album.title}
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: "100%",
                                      height: "100%",
                                      background:
                                        "linear-gradient(135deg, #00ffff, #ff0080)",
                                      borderRadius: 1,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      boxShadow:
                                        "0 4px 20px rgba(0, 0, 0, 0.4)",
                                    }}
                                  >
                                    <MusicNote
                                      sx={{
                                        fontSize: "3rem",
                                        color: "rgba(255, 255, 255, 0.9)",
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>

                              <Box
                                sx={{
                                  width: "60%",
                                  p: 3,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  "@media (max-width: 600px)": {
                                    width: "100%",
                                    p: 2,
                                  },
                                }}
                              >
                                <Box>
                                  <Typography
                                    variant="h5"
                                    sx={{
                                      fontWeight: 700,
                                      color: "#FFFFFF",
                                      fontSize: "1.5rem",
                                      mb: 2,
                                      lineHeight: 1.3,
                                      "@media (max-width: 600px)": {
                                        fontSize: "1.3rem",
                                        mb: 1.5,
                                      },
                                    }}
                                  >
                                    {album.title || "제목 없음"}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      mb: 2,
                                    }}
                                  >
                                    <Avatar
                                      src={album.user?.avatar}
                                      sx={{
                                        width: 40,
                                        height: 40,
                                        mr: 2,
                                        border:
                                          "2px solid rgba(255, 255, 255, 0.3)",
                                        "@media (max-width: 600px)": {
                                          width: 32,
                                          height: 32,
                                          mr: 1.5,
                                        },
                                      }}
                                    >
                                      <Person sx={{ fontSize: 22 }} />
                                    </Avatar>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        fontSize: "1rem",
                                        color: "rgba(255, 255, 255, 0.9)",
                                        fontWeight: 600,
                                        "@media (max-width: 600px)": {
                                          fontSize: "0.9rem",
                                        },
                                      }}
                                    >
                                      {album.user?.nickname ||
                                        `사용자 ${album.userId}`}
                                    </Typography>
                                  </Box>

                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: "rgba(255, 255, 255, 0.8)",
                                      lineHeight: 1.5,
                                      fontSize: "0.95rem",
                                      mb: 2,
                                      fontWeight: 400,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: "vertical",
                                      "@media (max-width: 600px)": {
                                        fontSize: "0.85rem",
                                        WebkitLineClamp: 2,
                                      },
                                    }}
                                  >
                                    {album.description ||
                                      "이 앨범에 대한 설명이 아직 작성되지 않았습니다."}
                                  </Typography>
                                </Box>

                                <Box>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      flexWrap: "wrap",
                                      gap: 1,
                                    }}
                                  >
                                    <Box sx={{ display: "flex", gap: 2 }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: "0.9rem",
                                          color: "rgba(255, 255, 255, 0.9)",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 0.5,
                                          fontWeight: 600,
                                          "@media (max-width: 600px)": {
                                            fontSize: "0.8rem",
                                          },
                                        }}
                                      >
                                        ♫ {album.trackCount || 0}곡
                                      </Typography>
                                      {album.totalDuration > 0 && (
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontSize: "0.9rem",
                                            color: "rgba(255, 255, 255, 0.9)",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            fontWeight: 600,
                                            "@media (max-width: 600px)": {
                                              fontSize: "0.8rem",
                                            },
                                          }}
                                        >
                                          ⏱{" "}
                                          {Math.floor(
                                            (album.totalDuration || 0) / 60
                                          )}
                                          분
                                        </Typography>
                                      )}
                                    </Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: "0.85rem",
                                        color: "rgba(255, 255, 255, 0.6)",
                                        fontWeight: 400,
                                        "@media (max-width: 600px)": {
                                          fontSize: "0.75rem",
                                        },
                                      }}
                                    >
                                      {album.createdAt
                                        ? new Date(
                                            album.createdAt
                                          ).toLocaleDateString("ko-KR")
                                        : "날짜 없음"}
                                    </Typography>
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
      </div>
    </div>
  );
};

export default FeedPage;
