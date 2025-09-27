import React, { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
} from "@mui/material";

// 네온 사이버펑크 테마를 위한 CSS 애니메이션
const neonStyles = `
  @keyframes neonGlow {
    0%, 100% { 
      text-shadow: 
        0 0 5px #ec4899,
        0 0 10px #ec4899,
        0 0 15px #ec4899,
        0 0 20px #ec4899;
    }
    50% { 
      text-shadow: 
        0 0 2px #ec4899,
        0 0 5px #ec4899,
        0 0 8px #ec4899,
        0 0 12px #ec4899;
    }
  }
  
  @keyframes cyanGlow {
    0%, 100% { 
      text-shadow: 
        0 0 5px #06b6d4,
        0 0 10px #06b6d4,
        0 0 15px #06b6d4,
        0 0 20px #06b6d4;
    }
    50% { 
      text-shadow: 
        0 0 2px #06b6d4,
        0 0 5px #06b6d4,
        0 0 8px #06b6d4,
        0 0 12px #06b6d4;
    }
  }
  
  @keyframes neonBorder {
    0%, 100% { 
      box-shadow: 
        0 0 5px #ec4899,
        0 0 10px #ec4899,
        inset 0 0 5px rgba(236, 72, 153, 0.1);
    }
    50% { 
      box-shadow: 
        0 0 2px #ec4899,
        0 0 5px #ec4899,
        inset 0 0 2px rgba(236, 72, 153, 0.1);
    }
  }
  
  @keyframes cyanBorder {
    0%, 100% { 
      box-shadow: 
        0 0 5px #06b6d4,
        0 0 10px #06b6d4,
        inset 0 0 5px rgba(6, 182, 212, 0.1);
    }
    50% { 
      box-shadow: 
        0 0 2px #06b6d4,
        0 0 5px #06b6d4,
        inset 0 0 2px rgba(6, 182, 212, 0.1);
    }
  }
`;
import { theme } from "../styles/theme";
import {
  Add,
  Album,
  Mic,
  MusicNote,
  Favorite,
  PlayArrow,
  Edit,
  Search,
  Person,
  CalendarToday,
  Star,
  Delete,
  Wallpaper,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../stores/uiStore";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { useFollowList } from "../hooks/useSocial";
import { recordingService } from "../services/api/recordings";
import { motion } from "framer-motion";
import AlbumCoverflow from "../components/AlbumCoverflow";
import { albumService, userService, apiClient } from "../services/api";
import { clearAllDummyData } from "../utils/feedUtils";
import type {
  Album as AlbumType,
  MyPageStats,
  MyPageAlbumListResponse,
  MyPageLikedAlbumListResponse,
} from "../types/album";

// 사이버펑크 스타일 정의
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// 이미지 fallback 컴포넌트
interface ImageWithFallbackProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback: string;
  alt: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallback,
  alt,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallback);
    }
  };

  return <img {...props} src={imgSrc} alt={alt} onError={handleError} />;
};

// 통계 카드 컴포넌트
interface StatCardProps {
  icon: React.ComponentType<{ sx?: object }>;
  value: number;
  label: string;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  color = "#FFFFFF",
}) => {
  const cardStyles = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
    px: 2,
    py: 1.5,
    background: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(12px)",
    border: "2px solid #ec4899",
    borderRadius: 2,
    boxShadow: "0 0 15px #ec4899, inset 0 0 10px rgba(236, 72, 153, 0.1)",
    animation: "neonBorder 2s ease-in-out infinite",
    transition: "all 0.3s ease",
    minWidth: "80px",
    flex: "1 1 0",
    maxWidth: "120px",
    position: "relative",
    overflow: "hidden",
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "-100%",
      width: "100%",
      height: "100%",
      background: "linear-gradient(90deg, transparent, rgba(236, 72, 153, 0.2), transparent)",
      animation: "hologramScan 3s infinite",
    },
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 0 25px #ec4899, 0 0 50px rgba(6, 182, 212, 0.3), inset 0 0 15px rgba(236, 72, 153, 0.2)",
      border: "2px solid #06b6d4",
      animation: "cyanBorder 1.5s ease-in-out infinite",
    },
  };

  const iconStyles = {
    color: "#ec4899",
    fontSize: 20,
    textShadow: "0 0 10px #ec4899",
    animation: "neonGlow 2s ease-in-out infinite",
  };

  return (
    <Box sx={cardStyles}>
      <Icon sx={iconStyles} />
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#FFFFFF",
          fontSize: "1.1rem",
          lineHeight: 1,
          textAlign: "center",
          textShadow: "0 0 10px #ec4899",
          animation: "neonGlow 2s ease-in-out infinite",
        }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: "0.7rem",
          whiteSpace: "nowrap",
          textAlign: "center",
          fontWeight: 500,
          textShadow: "0 0 8px #06b6d4",
          animation: "cyanGlow 2s ease-in-out infinite",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useUIStore();
  const { user, updateProfile, isAuthenticated } = useAuth();
  const {
    profile,
    updateProfile: updateMyProfile,
    updateProfileWithImage: updateMyProfileWithImage,
    updateBackgroundImage,
    updateProfileImage,
    deleteProfileImage,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile() || {};

  // 팔로잉/팔로워 데이터 가져오기 (에러 처리 포함)
  const userId = profile?.userId || user?.id;
  const { data: followersData, error: followersError } = useFollowList(
    Number(userId),
    "followers"
  );
  const { data: followingData, error: followingError } = useFollowList(
    Number(userId),
    "following"
  );

  // 팔로잉/팔로워 API 에러 시 기본값 사용
  const safeFollowersCount = followersData?.totalElements || 0;
  const safeFollowingCount = followingData?.totalElements || 0;
  const [tabValue, setTabValue] = useState(0);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [followType, setFollowType] = useState<"following" | "followers">(
    "following"
  );
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [forceDefaultBackground, setForceDefaultBackground] = useState(() => {
    return localStorage.getItem("forceDefaultBackground") === "true";
  });

  // 배경 이미지 - 실제 프로필에서 가져오기
  const backgroundImage = useMemo(() => {
    console.log("배경 이미지 계산 중...");
    console.log("forceDefaultBackground:", forceDefaultBackground);
    console.log("profile?.backgroundImageUrl:", profile?.backgroundImageUrl);
    
    // 강제 기본 배경 플래그가 설정된 경우
    if (forceDefaultBackground) {
      console.log("강제 기본 배경 사용");
      return "url(https://images.unsplash.com/photo-1519608487953-e999c86e7455?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80)";
    }

    // 1순위: localStorage에 저장된 커스텀 배경 (앨범 커버 선택 등)
    const customBg = localStorage.getItem("customBackground");
    console.log("localStorage customBackground:", customBg);
    if (customBg && customBg !== "null" && customBg !== "") {
      // customBg가 이미 url() 형태인지 확인
      if (customBg.startsWith('url(')) {
        console.log("커스텀 배경 사용 (URL 형태):", customBg);
        return customBg;
      } else {
        console.log("커스텀 배경 사용 (일반 URL):", customBg);
        return `url(${customBg})`;
      }
    }

    // 2순위: 실제 프로필 API에서 가져온 배경화면 (기본 배경이 아닌 경우만)
    if (profile?.backgroundImageUrl && !profile.backgroundImageUrl.includes('default-background')) {
      console.log("프로필 배경 사용:", profile.backgroundImageUrl);
      return `url(${profile.backgroundImageUrl})`;
    }
    
    // 3순위: 기본 배경화면 (첫 로그인 시에도 표시)
    console.log("기본 배경 사용");
    return "url(https://images.unsplash.com/photo-1519608487953-e999c86e7455?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80)";
  }, [profile?.backgroundImageUrl, forceDefaultBackground]);

  // 프로필 데이터 통합 (useProfile 훅의 profile 데이터 직접 사용)
  const currentProfile = useMemo(() => {
    // useProfile 훅에서 이미 profile || user를 반환하므로 그대로 사용
    if (profile) {
      return {
        nickname: profile.nickname || "음악러버",
        introduction:
          profile.description ||
          "음악을 사랑하는 평범한 사람입니다. 노래 부르는 것이 취미예요!",
        profileImageUrl: profile.profileImageUrl || "",
      };
    }

    // profile이 없는 경우 기본값
    return {
      nickname: "음악러버",
      introduction:
        "음악을 사랑하는 평범한 사람입니다. 노래 부르는 것이 취미예요!",
      profileImageUrl: "",
    };
  }, [profile]);

  // 앨범 데이터 상태
  const [myAlbums, setMyAlbums] = useState<AlbumType[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsError, setAlbumsError] = useState<string | null>(null);

  // 좋아요한 앨범 상태
  const [likedAlbums, setLikedAlbums] = useState<AlbumType[]>([]);
  const [likedAlbumsLoading, setLikedAlbumsLoading] = useState(true);
  const [likedAlbumsError, setLikedAlbumsError] = useState<string | null>(null);

  // 마이페이지 통계 상태
  const [myPageStats, setMyPageStats] = useState<MyPageStats>({
    followerCount: 0,
    followingCount: 0,
    albumCount: 0,
    recordingCount: 0,
    totalLikes: 0,
    likedAlbumCount: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // 프로필 상태는 useProfile 훅에서 관리됨

  // 편집 폼 상태
  const [editForm, setEditForm] = useState({
    nickname: currentProfile.nickname,
    introduction: currentProfile.introduction,
  });

  // currentProfile이 변경될 때 editForm 업데이트
  useEffect(() => {
    setEditForm({
      nickname: currentProfile.nickname,
      introduction: currentProfile.introduction,
    });
  }, [currentProfile.nickname, currentProfile.introduction]);

  // 실제 녹음 데이터 상태 관리
  const [recordings, setRecordings] = useState<any[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState<string | null>(null);

  // 실제 사용자 통계 데이터 (나중에 API에서 가져올 예정)
  const [userStats, setUserStats] = useState({
    albums: 0,
    recordings: 0,
    likes: 0,
    followers: 0,
    following: 0,
  });

  // 더미 데이터 제거됨 - 실제 API 데이터 사용

  // 앨범 로딩 재시도 함수
  const loadAlbumsWithRetry = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1초

    setAlbumsLoading(true);
    setAlbumsError(null);

    try {
      const albumsResponse = await apiClient.get("/profiles/mypage/albums", {
        params: { page: 0, size: 100 },
      });
      const albumsData: MyPageAlbumListResponse = albumsResponse.data;
      setMyAlbums(albumsData.albums);
      console.log("앨범 데이터 로드 성공:", albumsData.albums.length, "개");
    } catch (error) {
      console.error(`앨범 데이터 로드 실패 (시도 ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`${retryDelay}ms 후 재시도합니다...`);
        setTimeout(() => {
          loadAlbumsWithRetry(retryCount + 1);
        }, retryDelay);
      } else {
        setAlbumsError("앨범을 불러오는데 실패했습니다. 새로고침을 시도해주세요.");
        setMyAlbums([]);
        showToast("앨범을 불러오는데 실패했습니다.", "error");
      }
    } finally {
      setAlbumsLoading(false);
    }
  };

  // 좋아요한 앨범 로딩 재시도 함수
  const loadLikedAlbumsWithRetry = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1초

    setLikedAlbumsLoading(true);
    setLikedAlbumsError(null);

    try {
      const likedAlbumsResponse = await apiClient.get("/profiles/mypage/liked-albums", {
        params: { page: 0, size: 100 },
      });
      const likedAlbumsData = likedAlbumsResponse.data;
      // 백엔드 응답 구조에 맞게 수정: likedAlbums 필드 사용
      setLikedAlbums(likedAlbumsData.likedAlbums || likedAlbumsData.albums || []);
      console.log("좋아요한 앨범 데이터 로드 성공:", (likedAlbumsData.likedAlbums || likedAlbumsData.albums || []).length, "개");
    } catch (error) {
      console.error(`좋아요한 앨범 데이터 로드 실패 (시도 ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      if (retryCount < maxRetries) {
        console.log(`${retryDelay}ms 후 재시도합니다...`);
        setTimeout(() => {
          loadLikedAlbumsWithRetry(retryCount + 1);
        }, retryDelay);
      } else {
        setLikedAlbumsError("좋아요한 앨범을 불러오는데 실패했습니다.");
        setLikedAlbums([]);
      }
    } finally {
      setLikedAlbumsLoading(false);
    }
  };

  // 마이페이지 데이터 로드
  useEffect(() => {
    const loadMyPageData = async () => {
      // 인증 상태 확인
      if (!isAuthenticated) {
        console.log("인증되지 않은 상태입니다. 데이터 로딩을 건너뜁니다.");
        return;
      }

      try {
        // 더미 데이터 제거
        clearAllDummyData();

        // 통계 데이터 로드
        setStatsLoading(true);
        try {
          const statsResponse = await apiClient.get("/profiles/mypage/stats");
          setMyPageStats(statsResponse.data);
        } catch (error) {
          console.error("통계 데이터 로드 실패:", error);
          // 서버 에러 시 실제 팔로잉/팔로워 API 데이터 사용
          setMyPageStats({
            followerCount: followersData?.totalElements || 0,
            followingCount: followingData?.totalElements || 0,
            albumCount: myAlbums.length,
            recordingCount: recordings.length,
            totalLikes: 0,
            likedAlbumCount: 0,
          });
          showToast("통계 데이터를 개별 API로 로드했습니다.", "info");
        }

        // 내 앨범 목록 로드 (재시도 로직 포함)
        await loadAlbumsWithRetry();

        // 좋아요한 앨범 목록 로드 (재시도 로직 포함)
        await loadLikedAlbumsWithRetry();

        // 내 녹음 목록 로드
        setRecordingsLoading(true);
        setRecordingsError(null);
        try {
          const recordingsData = await recordingService.getMyRecordings();
          setRecordings(recordingsData || []);
        } catch (error) {
          console.error("녹음 데이터 로드 실패:", error);
          setRecordingsError("녹음 데이터를 불러오는데 실패했습니다.");
          setRecordings([]);
        } finally {
          setRecordingsLoading(false);
        }
      } finally {
        setAlbumsLoading(false);
        setLikedAlbumsLoading(false);
        setStatsLoading(false);
      }
    };

    loadMyPageData();
  }, [isAuthenticated]);

  // 통계 데이터 계산 (API 데이터 사용)
  useEffect(() => {
    setUserStats({
      albums: myPageStats.albumCount,
      recordings: recordings.length, // 실제 녹음 데이터 사용
      likes: myPageStats.likedAlbumCount || myPageStats.totalLikes || 0,
      followers: safeFollowersCount, // 안전한 팔로워 수
      following: safeFollowingCount, // 안전한 팔로잉 수
    });
  }, [myPageStats, recordings, safeFollowersCount, safeFollowingCount]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNewRecording = () => {
    navigate("/record");
  };

  const handleProfileEdit = () => {
    setEditForm({
      nickname: currentProfile.nickname,
      introduction: currentProfile.introduction,
    });
    setProfileEditOpen(true);
  };

  const handleFollowClick = (type: "following" | "followers") => {
    setFollowType(type);
    setFollowModalOpen(true);
  };

  const handleFormChange = (
    field: "nickname" | "introduction",
    value: string
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        showToast("파일 크기는 5MB 이하여야 합니다.", "error");
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith("image/")) {
        showToast("이미지 파일만 업로드 가능합니다.", "error");
        return;
      }

      try {
        // 실제 API 호출
        const success = await updateProfileImage(file);
        if (success) {
          showToast("프로필 사진이 업로드되었습니다.", "success");
        } else {
          throw new Error("프로필 사진 업로드에 실패했습니다.");
        }
      } catch (error) {
        console.error("프로필 이미지 업로드 실패:", error);
        showToast("프로필 사진 업로드에 실패했습니다.", "error");
      }
    }
  };

  const handleSaveProfile = async () => {
    try {
      // 실제 API 호출
      const success = await updateMyProfile({
        nickname: editForm.nickname,
        gender: profile?.gender || "male", // 기존 성별 유지 또는 기본값
        description: editForm.introduction,
      });

      if (success) {
        setProfileEditOpen(false);
        showToast("프로필이 성공적으로 저장되었습니다.", "success");
      } else {
        throw new Error("프로필 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      showToast("프로필 저장에 실패했습니다.", "error");
    }
  };

  const handleResetProfileImage = async () => {
    try {
      // 서버에 기본 프로필 이미지가 있다면 해당 이미지를 가져와서 업로드
      // 또는 빈 이미지를 업로드해서 서버에서 기본 이미지로 처리하도록 함

      // 기본 프로필 이미지 URL에서 이미지를 가져와서 업로드
      const defaultImageUrl = "/images/default-profile.svg"; // 기본 프로필 이미지

      try {
        const response = await fetch(defaultImageUrl);
        if (response.ok) {
          const blob = await response.blob();
          const defaultFile = new File([blob], "default-profile.png", {
            type: "image/png",
          });
          const success = await updateProfileImage(defaultFile);
          if (success) {
            showToast("프로필 사진이 기본 이미지로 변경되었습니다.", "success");
            return;
          }
        }
      } catch (fetchError) {
        console.log(
          "기본 이미지 파일을 찾을 수 없습니다. 빈 이미지로 대체합니다."
        );
      }

      // 기본 이미지가 없으면 1x1 투명 픽셀 이미지 생성
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, 1, 1);
      }

      canvas.toBlob(async (blob) => {
        if (blob) {
          const defaultFile = new File([blob], "default.png", {
            type: "image/png",
          });
          const success = await updateProfileImage(defaultFile);
          if (success) {
            showToast("프로필 사진이 기본 이미지로 변경되었습니다.", "success");
          } else {
            throw new Error("프로필 사진 초기화에 실패했습니다.");
          }
        }
      }, "image/png");
    } catch (error) {
      console.error("프로필 사진 초기화 실패:", error);
      showToast(
        "프로필 사진 초기화에 실패했습니다. 백엔드 서버를 확인해주세요.",
        "error"
      );
    }
  };

  // 녹음 추가는 이제 녹음 페이지에서 API를 통해 직접 처리됨

  // 녹음 삭제 함수 (실제 API 사용)
  const handleDeleteRecording = async (recordingId: number) => {
    if (!confirm("녹음을 삭제하시겠습니까?")) return;

    try {
      await recordingService.deleteRecording(recordingId);
      setRecordings((prev) =>
        prev.filter((recording) => recording.id !== recordingId)
      );
      showToast("녹음이 삭제되었습니다.", "success");
    } catch (error) {
      console.error("녹음 삭제 실패:", error);
      showToast("녹음 삭제에 실패했습니다.", "error");
    }
  };

  // 레거시 함수 (더미데이터용 - 제거 예정)
  const deleteRecording = (recordingIndex: number) => {
    setRecordings((prev) =>
      prev.filter((_, index) => index !== recordingIndex)
    );
    showToast("녹음이 삭제되었습니다.", "success");
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "높음":
        return "#4caf50";
      case "보통":
        return "#ff9800";
      case "낮음":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getProcessingStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "#4caf50";
      case "PROCESSING":
      case "CONVERTING":
      case "ANALYSIS_PENDING":
        return "#ff9800";
      case "UPLOADED":
        return "#2196f3";
      case "FAILED":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: neonStyles }} />
      <div style={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.3) 0%, transparent 60%),
          radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.3) 0%, transparent 60%),
          radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 80%),
          radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.2) 0%, transparent 70%),
          linear-gradient(135deg, #000000 0%, #0a0a0a 30%, #1a0a1a 70%, #000000 100%)
        `,
        color: '#fff',
        paddingTop: '100px',
        overflowX: 'hidden',
        position: 'relative',
      }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      <Box
        sx={{
          flex: 1,
          minHeight: "100vh",
          pt: { xs: 2, sm: 3 },
          position: "relative",
        }}
      >
      <Container maxWidth="lg" sx={{ py: 3, position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              background: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(20px)",
              borderRadius: 3,
              overflow: "hidden",
              border: "2px solid #ec4899",
              boxShadow: "0 0 20px #ec4899, inset 0 0 20px rgba(236, 72, 153, 0.1)",
              animation: "neonBorder 3s ease-in-out infinite",
            }}
          >
            {/* 프로필 섹션 */}
            <Box
              sx={{
                p: 4,
                borderBottom: "2px solid #ec4899",
                position: "relative",
                overflow: "hidden",
                backgroundImage,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(0, 0, 0, 0.3) 100%)",
                  pointerEvents: "none",
                  zIndex: 0,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 3,
                  mb: 3,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Avatar
                  src={currentProfile.profileImageUrl}
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: "rgba(196, 71, 233, 0.2)",
                    fontSize: "2rem",
                    border: "3px solid rgba(196, 71, 233, 0.3)",
                    boxShadow: "0 0 20px rgba(196, 71, 233, 0.3)",
                    color: "#C147E9",
                  }}
                >
                  {!currentProfile.profileImageUrl && <Person />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: "#FFFFFF",
                      background:
                        "linear-gradient(135deg,rgb(249, 248, 248) 0%, #C147E9 50%, #8B5CF6 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 0 20px rgba(210, 151, 228, 0.5)",
                    }}
                  >
                    {currentProfile.nickname}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                    <Button
                      variant="text"
                      onClick={() => handleFollowClick("following")}
                      sx={{
                        p: 0,
                        minWidth: "auto",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "rgba(196, 71, 233, 0.1)",
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                      >
                        {safeFollowingCount} 팔로잉
                      </Typography>
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => handleFollowClick("followers")}
                      sx={{
                        p: 0,
                        minWidth: "auto",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "rgba(196, 71, 233, 0.1)",
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                      >
                        {safeFollowersCount} 팔로워
                      </Typography>
                    </Button>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <CalendarToday
                      sx={{ fontSize: 16, color: "rgba(255, 255, 255, 0.8)" }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      2024. 12. 1.부터 활동
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 2, color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    {currentProfile.introduction}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={handleProfileEdit}
                      sx={{
                        textTransform: "none",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        color: "rgba(255, 255, 255, 0.9)",
                        "&:hover": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#FFFFFF",
                        },
                      }}
                    >
                      프로필 편집
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Wallpaper />}
                      onClick={() => setIsBackgroundModalOpen(true)}
                      sx={{
                        textTransform: "none",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        color: "rgba(255, 255, 255, 0.9)",
                        "&:hover": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                          color: "#FFFFFF",
                        },
                      }}
                    >
                      배경화면 설정
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* 통계 카드 - 컴팩트 정돈 */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  mb: 3,
                  justifyContent: "center",
                  flexWrap: "wrap",
                }}
              >
                <StatCard
                  icon={Album}
                  value={userStats.albums}
                  label="앨범"
                  color="#FFFFFF"
                />
                <StatCard
                  icon={Mic}
                  value={userStats.recordings}
                  label="녹음"
                  color="#FFFFFF"
                />
                <StatCard
                  icon={Favorite}
                  value={userStats.likes}
                  label="좋아요"
                  color="#FF6B9D"
                />
              </Box>
            </Box>

            {/* 탭 네비게이션 */}
            <Box
              sx={{
                borderBottom: 1,
                borderColor: "rgba(236, 72, 153, 0.3)",
                background: "rgba(26, 26, 46, 0.3)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 20px rgba(236, 72, 153, 0.1)",
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  "& .MuiTab-root": {
                    color: "#ffffff",
                    fontWeight: "bold",
                    textTransform: "none",
                    fontSize: "1rem",
                    textShadow: "0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(66, 253, 235, 0.4)",
                    animation: "neonGlow 2s ease-in-out infinite",
                    "&.Mui-selected": {
                      color: "#ffffff",
                      textShadow: "0 0 20px rgba(255, 255, 255, 1), 0 0 35px rgba(66, 253, 235, 0.6)",
                      animation: "neonGlow 2s ease-in-out infinite",
                    },
                    "&:hover": {
                      color: "#ffffff",
                      textShadow: "0 0 20px rgba(255, 255, 255, 1), 0 0 35px rgba(66, 253, 235, 0.6)",
                      animation: "neonGlow 1.5s ease-in-out infinite",
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#06b6d4",
                    height: 3,
                    borderRadius: "3px 3px 0 0",
                    boxShadow: "0 0 15px #06b6d4",
                    animation: "cyanBorder 2s ease-in-out infinite",
                  },
                }}
              >
                <Tab
                  icon={<Album />}
                  label="내 앨범"
                  iconPosition="start"
                  sx={{ textTransform: "none" }}
                />
                <Tab
                  icon={<Mic />}
                  label="내 녹음"
                  iconPosition="start"
                  sx={{ textTransform: "none" }}
                />
                <Tab
                  icon={<Favorite />}
                  label="좋아요한 앨범"
                  iconPosition="start"
                  sx={{ textTransform: "none" }}
                />
              </Tabs>
            </Box>

            {/* 탭 콘텐츠 */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "bold", color: "#FFFFFF" }}
                  >
                    💿 내 앨범 ({myAlbums.length})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => navigate("/albums/create")}
                    sx={{
                      textTransform: "none",
                      background: "transparent",
                      border: "2px solid #ec4899",
                      color: "#ffffff",
                      "&:hover": {
                        background: "rgba(236, 72, 153, 0.1)",
                        border: "2px solid #ec4899",
                        boxShadow: "0 0 15px rgba(236, 72, 153, 0.5)",
                      },
                    }}
                  >
                    새 앨범 만들기
                  </Button>
                </Box>

                {/* 앨범 로딩/에러/데이터 표시 */}
                {albumsLoading ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography
                      variant="h6"
                      sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      앨범을 불러오는 중...
                    </Typography>
                  </Box>
                ) : albumsError ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Typography variant="h6" sx={{ color: "#FF6B6B", mb: 2 }}>
                      {albumsError}
                    </Typography>
                    <Button
                      onClick={() => loadAlbumsWithRetry()}
                      variant="outlined"
                      sx={{ color: "#FFFFFF", borderColor: "#FFFFFF" }}
                    >
                      다시 시도
                    </Button>
                  </Box>
                ) : myAlbums.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Album
                      sx={{
                        fontSize: 64,
                        color: "rgba(255, 255, 255, 0.6)",
                        mb: 2,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{ mb: 1, color: "rgba(255, 255, 255, 0.8)" }}
                    >
                      아직 만든 앨범이 없습니다
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255, 255, 255, 0.6)", mb: 3 }}
                    >
                      첫 번째 앨범을 만들어보세요!
                    </Typography>
                  </Box>
                ) : (
                  /* 3D Coverflow */
                  <AlbumCoverflow
                    albums={myAlbums.map((album) => ({
                      id: album.id.toString(),
                      title: album.title,
                      coverImageUrl:
                        album.coverImageUrl || "/image/albumCoverImage.png", // 백엔드에서 제공하는 coverImageUrl 사용
                      artist: "나",
                      year: new Date(album.createdAt).getFullYear().toString(),
                      trackCount: album.trackCount,
                    }))}
                    onAlbumClick={(album) =>
                      navigate(`/albums/${album.id}`, {
                        state: { from: "/me" },
                      })
                    }
                    onPlayClick={(album) => {
                      // 재생 기능 구현
                      console.log("Play album:", album.title);
                    }}
                    title="My Albums"
                  />
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#FFFFFF" }}
                >
                  🎤 내 녹음 ({recordings.length})
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleNewRecording}
                    sx={{ textTransform: "none" }}
                  >
                    새 녹음하기
                  </Button>
                  {/* 테스트 녹음 추가 버튼 제거 - 실제 녹음만 사용 */}
                </Box>
              </Box>

              <TextField
                fullWidth
                placeholder="제목이나 가수명으로 검색..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: 2,
                    "& fieldset": {
                      border: "none",
                    },
                    "&:hover fieldset": {
                      border: "none",
                    },
                    "&.Mui-focused fieldset": {
                      border: "1px solid rgba(196, 71, 233, 0.5)",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#FFFFFF",
                    "&::placeholder": {
                      color: "rgba(255, 255, 255, 0.6)",
                      opacity: 1,
                    },
                  },
                }}
              />

              {/* 녹음 로딩/에러 상태 */}
              {recordingsLoading ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    녹음을 불러오는 중...
                  </Typography>
                </Box>
              ) : recordingsError ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography variant="h6" sx={{ color: "#FF6B6B", mb: 2 }}>
                    녹음 데이터 로드 실패
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)", mb: 2 }}
                  >
                    {recordingsError}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => window.location.reload()}
                  >
                    다시 시도
                  </Button>
                </Box>
              ) : recordings.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Mic
                    sx={{
                      fontSize: 64,
                      color: "rgba(255, 255, 255, 0.6)",
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    아직 녹음이 없습니다
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    첫 번째 녹음을 만들어보세요!
                  </Typography>
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    background: "rgba(0, 0, 0, 0.6)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    border: "2px solid #ec4899",
                    boxShadow: "0 0 15px #ec4899, inset 0 0 10px rgba(236, 72, 153, 0.1)",
                    animation: "neonBorder 2s ease-in-out infinite",
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ 
                            color: "#FFFFFF", 
                            fontWeight: "bold",
                            textShadow: "0 0 10px #ec4899",
                            borderBottom: "2px solid #ec4899",
                          }}
                        >
                          곡 정보
                        </TableCell>
                        <TableCell
                          sx={{ 
                            color: "#FFFFFF", 
                            fontWeight: "bold",
                            textShadow: "0 0 10px #ec4899",
                            borderBottom: "2px solid #ec4899",
                          }}
                        >
                          재생시간
                        </TableCell>
                        <TableCell
                          sx={{ 
                            color: "#FFFFFF", 
                            fontWeight: "bold",
                            textShadow: "0 0 10px #ec4899",
                            borderBottom: "2px solid #ec4899",
                          }}
                        >
                          녹음일
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recordings.map((recording, index) => (
                        <TableRow key={recording.id || index}>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <IconButton
                                size="small"
                                sx={{
                                  color: "#FFFFFF",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  },
                                }}
                                onClick={() => {
                                  // TODO: 녹음 재생 기능 구현
                                  console.log("재생:", recording.title);
                                }}
                              >
                                <PlayArrow />
                              </IconButton>
                              <Box>
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: "bold", color: "#FFFFFF" }}
                                >
                                  {recording.title}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                                >
                                  {recording.song?.artist || "알 수 없음"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ color: "#FFFFFF" }}
                            >
                              {Math.floor(recording.durationSeconds / 60)}:
                              {(recording.durationSeconds % 60)
                                .toString()
                                .padStart(2, "0")}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ color: "#FFFFFF" }}
                            >
                              {new Date(recording.createdAt).toLocaleDateString(
                                "ko-KR",
                                { month: "long", day: "numeric" }
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDeleteRecording(recording.id)
                              }
                              sx={{
                                color: "#FF6B6B",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 107, 107, 0.1)",
                                  color: "#FF5252",
                                },
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", mb: 3, color: "#FFFFFF" }}
              >
                💖 좋아요한 앨범 ({likedAlbums.length})
              </Typography>
              {likedAlbumsLoading ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    로딩 중...
                  </Typography>
                </Box>
              ) : likedAlbumsError ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography
                    variant="h6"
                    sx={{ color: "#FF6B6B", mb: 2 }}
                  >
                    {likedAlbumsError}
                  </Typography>
                  <Button
                    onClick={() => loadLikedAlbumsWithRetry()}
                    variant="outlined"
                    sx={{ color: "#FFFFFF", borderColor: "#FFFFFF" }}
                  >
                    다시 시도
                  </Button>
                </Box>
              ) : likedAlbums.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Favorite
                    sx={{
                      fontSize: 64,
                      color: "rgba(255, 255, 255, 0.6)",
                      mb: 2,
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{ mb: 1, color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    아직 좋아요한 앨범이 없습니다
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                  >
                    마음에 드는 앨범에 좋아요를 눌러보세요!
                  </Typography>
                </Box>
              ) : (
                <AlbumCoverflow
                  albums={likedAlbums.map((album) => ({
                    id: album.id.toString(),
                    title: album.title,
                    artist: album.userNickname || "Various Artists", // 좋아요한 앨범의 아티스트 정보
                    coverImageUrl:
                      album.coverImageUrl || "/image/albumCoverImage.png",
                    year: new Date(album.createdAt).getFullYear().toString(),
                    trackCount: album.trackCount,
                    likeCount: album.likeCount, // 좋아요 수 추가
                  }))}
                  onAlbumClick={(album) => {
                    console.log("좋아요한 앨범 클릭:", album);
                    navigate(`/albums/${album.id}`, {
                      state: { from: "/me" },
                    });
                  }}
                  title="Like Albums"
                />
              )}
            </TabPanel>
          </Paper>
        </motion.div>
      </Container>

      {/* 프로필 편집 모달 */}
      <Dialog
        open={profileEditOpen}
        onClose={() => setProfileEditOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.colors.background.main,
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#FFFFFF",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            pb: 2,
          }}
        >
          <Person sx={{ color: "#C147E9" }} />
          프로필 편집
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Avatar
              src={currentProfile.profileImageUrl}
              sx={{
                width: 80,
                height: 80,
                mx: "auto",
                mb: 2,
                bgcolor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              {!currentProfile.profileImageUrl && (
                <Person sx={{ color: "rgba(255, 255, 255, 0.8)" }} />
              )}
            </Avatar>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="profile-image-upload"
              type="file"
              onChange={handleImageUpload}
              onClick={(e) => {
                // 같은 파일을 다시 선택할 수 있도록 value 초기화
                (e.target as HTMLInputElement).value = "";
              }}
            />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <label htmlFor="profile-image-upload">
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  component="span"
                  sx={{
                    color: "#FFFFFF",
                    borderColor: "rgba(255, 255, 255, 0.3)",
                    "&:hover": {
                      borderColor: "#C147E9",
                      backgroundColor: "rgba(196, 71, 233, 0.1)",
                    },
                  }}
                >
                  사진 변경
                </Button>
              </label>
              {currentProfile.profileImageUrl && (
                <Button
                  variant="outlined"
                  onClick={handleResetProfileImage}
                  sx={{
                    color: "#FF6B6B",
                    borderColor: "rgba(255, 107, 107, 0.3)",
                    "&:hover": {
                      borderColor: "#FF6B6B",
                      backgroundColor: "rgba(255, 107, 107, 0.1)",
                    },
                  }}
                >
                  초기화
                </Button>
              )}
            </Box>
          </Box>
          <TextField
            fullWidth
            label="활동명 *"
            value={editForm.nickname}
            onChange={(e) => handleFormChange("nickname", e.target.value)}
            helperText={`${editForm.nickname.length} / 20자`}
            inputProps={{ maxLength: 20 }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 2,
                "& fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "1px solid rgba(196, 71, 233, 0.5)",
                },
              },
              "& .MuiInputBase-input": {
                color: "#FFFFFF",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-focused": {
                  color: "#C147E9",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255, 255, 255, 0.6)",
              },
            }}
          />
          <TextField
            fullWidth
            label="소개"
            multiline
            rows={4}
            value={editForm.introduction}
            onChange={(e) => handleFormChange("introduction", e.target.value)}
            helperText={`${editForm.introduction.length} / 200자`}
            inputProps={{ maxLength: 200 }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 2,
                "& fieldset": {
                  border: "none",
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "1px solid rgba(196, 71, 233, 0.5)",
                },
              },
              "& .MuiInputBase-input": {
                color: "#FFFFFF",
                "&::placeholder": {
                  color: "rgba(255, 255, 255, 0.6)",
                  opacity: 1,
                },
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
                "&.Mui-focused": {
                  color: "#C147E9",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "rgba(255, 255, 255, 0.6)",
              },
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            pt: 2,
            px: 3,
          }}
        >
          <Button
            onClick={() => setProfileEditOpen(false)}
            sx={{
              color: "rgba(255, 255, 255, 0.7)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
              },
            }}
          >
            취소
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={!editForm.nickname.trim()}
            sx={{
              background: "linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)",
              },
              "&:disabled": {
                background: "rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 팔로잉/팔로워 모달 */}
      <Dialog
        open={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {followType === "following" ? "팔로잉" : "팔로워"}
        </DialogTitle>
        <DialogContent>
          {followType === "following" ? (
            <Box>
              <Typography variant="h6" sx={{ color: "#FFFFFF", mb: 2 }}>
                팔로잉 중인 사용자 ({followingData?.totalElements || 0}명)
              </Typography>
              {followingData?.content?.length ? (
                <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                  {followingData.content.map((user) => (
                    <Box
                      key={user.userId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 1,
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <Person />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                          {user.nickname}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                        >
                          {user.email}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                      >
                        {new Date(user.followedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    textAlign: "center",
                    py: 4,
                  }}
                >
                  아직 팔로잉하는 사용자가 없습니다.
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" sx={{ color: "#FFFFFF", mb: 2 }}>
                팔로워 ({followersData?.totalElements || 0}명)
              </Typography>
              {followersData?.content?.length ? (
                <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                  {followersData.content.map((user) => (
                    <Box
                      key={user.userId}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        py: 1,
                        borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "rgba(255, 255, 255, 0.2)",
                        }}
                      >
                        <Person />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ color: "#FFFFFF" }}>
                          {user.nickname}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                        >
                          {user.email}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.6)" }}
                      >
                        {new Date(user.followedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(255, 255, 255, 0.6)",
                    textAlign: "center",
                    py: 4,
                  }}
                >
                  아직 팔로워가 없습니다.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFollowModalOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 배경화면 설정 모달 */}
      <Dialog
        open={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            background: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#FFFFFF",
            fontSize: "1.5rem",
            fontWeight: 600,
            textAlign: "center",
            pb: 2,
          }}
        >
          배경화면 설정
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: "#FFFFFF",
                mb: 2,
                fontSize: "1.1rem",
                fontWeight: 500,
              }}
            >
              사진 업로드
            </Typography>
            <Box
              component="label"
              sx={{
                border: "2px dashed rgba(255, 255, 255, 0.3)",
                borderRadius: 2,
                p: 3,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "block",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              }}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // 파일 크기 체크 (5MB 제한)
                    if (file.size > 5 * 1024 * 1024) {
                      showToast("파일 크기는 5MB 이하여야 합니다.", "error");
                      return;
                    }

                    // 이미지 파일 타입 체크
                    if (!file.type.startsWith("image/")) {
                      showToast("이미지 파일만 업로드 가능합니다.", "error");
                      return;
                    }

                    try {
                      if (updateBackgroundImage) {
                        const success = await updateBackgroundImage(file);
                        if (success) {
                          // 새 배경 업로드 성공 시 강제 기본 배경 플래그 해제
                          setForceDefaultBackground(false);
                          localStorage.removeItem("forceDefaultBackground");
                          showToast("배경 이미지가 설정되었습니다.", "success");
                          setIsBackgroundModalOpen(false);
                          return;
                        }
                      }

                      // Fallback: localStorage 사용
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const imageUrl = event.target?.result as string;
                        localStorage.setItem("customBackground", imageUrl);
                        showToast("배경 이미지가 설정되었습니다.", "success");
                        setIsBackgroundModalOpen(false);
                        window.location.reload();
                      };
                      reader.readAsDataURL(file);
                    } catch (error) {
                      showToast("배경 이미지 업로드에 실패했습니다.", "error");
                    }
                  }
                }}
              />
              <Wallpaper
                sx={{
                  fontSize: 48,
                  color: "rgba(255, 255, 255, 0.6)",
                  mb: 1,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: "rgba(255, 255, 255, 0.8)",
                  mb: 1,
                }}
              >
                클릭하여 배경 이미지 업로드
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                JPG, PNG 파일만 지원됩니다
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: "#FFFFFF",
                mb: 2,
                fontSize: "1.1rem",
                fontWeight: 500,
              }}
            >
              앨범 커버에서 선택
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                gap: 2,
                maxHeight: 200,
                overflowY: "auto",
                pr: 1,
              }}
            >
              {myAlbums.map((album) => (
                <Box
                  key={album.id}
                  sx={{
                    aspectRatio: "1",
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "2px solid transparent",
                    backgroundColor: "rgba(255, 255, 255, 0.1)", // 기본 배경색 추가
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": {
                      borderColor: "rgba(255, 255, 255, 0.5)",
                      transform: "scale(1.05)",
                    },
                  }}
                  onClick={async () => {
                    console.log("앨범 커버 클릭됨:", album.title, album.coverImageUrl);
                    
                    if (
                      album.coverImageUrl &&
                      album.coverImageUrl !== "/image/albumCoverImage.png" &&
                      album.coverImageUrl !== "default"
                    ) {
                      try {
                        // URL이 상대 경로인 경우 절대 경로로 변환
                        let imageUrl = album.coverImageUrl;
                        if (imageUrl.startsWith('/')) {
                          imageUrl = `${window.location.origin}${imageUrl}`;
                        }
                        
                        console.log("설정할 배경 URL:", imageUrl);
                        
                        // 앨범 커버를 배경으로 설정 (url() 형태로 저장)
                        localStorage.setItem(
                          "customBackground",
                          `url(${imageUrl})`
                        );
                        
                        // 강제 기본 배경 플래그 해제
                        setForceDefaultBackground(false);
                        localStorage.removeItem("forceDefaultBackground");
                        
                        console.log("localStorage에 저장됨:", localStorage.getItem("customBackground"));
                        
                        // 서버에 배경 이미지 업로드 (선택사항)
                        if (updateBackgroundImage) {
                          try {
                            const response = await fetch(imageUrl);
                            if (response.ok) {
                              const blob = await response.blob();
                              const file = new File([blob], 'album-cover.png', { type: 'image/png' });
                              await updateBackgroundImage(file);
                              console.log("서버 업로드 성공");
                            }
                          } catch (uploadError) {
                            console.log("서버 업로드 실패, 로컬에서만 적용:", uploadError);
                          }
                        }
                        
                        showToast(
                          "앨범 커버가 배경으로 설정되었습니다.",
                          "success"
                        );
                        setIsBackgroundModalOpen(false);
                        
                        // 페이지 새로고침으로 배경 적용
                        setTimeout(() => {
                          window.location.reload();
                        }, 500);
                      } catch (error) {
                        console.error("배경 설정 실패:", error);
                        showToast("배경 설정에 실패했습니다.", "error");
                      }
                    } else {
                      console.log("유효하지 않은 커버 이미지:", album.coverImageUrl);
                      showToast(
                        "이 앨범에는 커버 이미지가 설정되지 않았습니다.",
                        "info"
                      );
                    }
                  }}
                >
                  {album.coverImageUrl &&
                  album.coverImageUrl !== "/image/albumCoverImage.png" ? (
                    <ImageWithFallback
                      src={album.coverImageUrl}
                      fallback="/image/albumCoverImage.png"
                      alt={album.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <Album
                      sx={{ fontSize: 40, color: "rgba(255, 255, 255, 0.6)" }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography
              variant="h6"
              sx={{
                color: "#FFFFFF",
                mb: 2,
                fontSize: "1.1rem",
                fontWeight: 500,
              }}
            >
              기본 배경으로 복원
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={async () => {
                try {
                  // 1. localStorage 커스텀 배경 제거
                  localStorage.removeItem("customBackground");

                  // 2. 강제 기본 배경 플래그 설정
                  setForceDefaultBackground(true);
                  localStorage.setItem("forceDefaultBackground", "true");

                  // 3. 서버의 배경화면을 기본 이미지로 업로드 (서버와 동기화)
                  if (updateBackgroundImage) {
                    try {
                      const defaultImageUrl =
                        "https://images.unsplash.com/photo-1519608487953-e999c86e7455?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80";
                      const response = await fetch(defaultImageUrl);
                      if (response.ok) {
                        const blob = await response.blob();
                        const defaultBgFile = new File(
                          [blob],
                          "default-background.jpg",
                          { type: "image/jpeg" }
                        );
                        const success = await updateBackgroundImage(
                          defaultBgFile
                        );
                        if (success) {
                          // 서버 업로드 성공 시 플래그 해제하고 기본 배경을 localStorage에 저장
                          setForceDefaultBackground(false);
                          localStorage.removeItem("forceDefaultBackground");
                          localStorage.setItem("customBackground", `url(${defaultImageUrl})`);
                        } else {
                          // 서버 업로드 실패 시에도 플래그는 유지
                          console.log("서버 업로드 실패, 강제 기본 배경 플래그 유지");
                        }
                      }
                    } catch (uploadError) {
                      console.log(
                        "기본 배경 서버 업로드 실패, 로컬에서만 기본 배경 적용"
                      );
                      // 서버 업로드 실패해도 플래그는 유지 (로컬에서 기본 배경 표시)
                    }
                  }

                  showToast("기본 배경으로 복원되었습니다.", "success");
                  setIsBackgroundModalOpen(false);

                  // 페이지 새로고침으로 배경 적용
                  window.location.reload();
                } catch (error) {
                  console.error("배경 복원 실패:", error);
                  showToast("기본 배경 복원에 실패했습니다.", "error");
                }
              }}
              sx={{
                borderColor: "rgba(255, 255, 255, 0.3)",
                color: "rgba(255, 255, 255, 0.8)",
                py: 1.5,
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              기본 배경으로 복원
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setIsBackgroundModalOpen(false)}
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </div>
    </>
  );
};

export default MyPage;
