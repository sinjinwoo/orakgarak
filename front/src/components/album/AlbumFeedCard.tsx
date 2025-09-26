import React from 'react';
import { Box, Typography, Avatar, Chip, CardMedia } from '@mui/material';
import { Person } from '@mui/icons-material';
import { Album } from 'lucide-react';

interface AlbumFeedCardProps {
  album: {
    id: number;
    title: string;
    description?: string;
    coverImageUrl?: string;
    trackCount?: number;
    totalDuration?: number;
    createdAt: string;
    user?: {
      nickname: string;
      avatar?: string;
    };
    userNickname?: string;
    userProfileImageUrl?: string;
    userId: number;
    tags?: string[];
  };
  onClick?: () => void;
}

const AlbumFeedCard: React.FC<AlbumFeedCardProps> = ({ album, onClick }) => {
  return (
    <Box
      sx={{
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        borderRadius: 2,
        p: 2,
        minWidth: "280px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        transition: "all 0.3s ease",
        "&:hover": onClick ? {
          transform: "translateY(-4px)",
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
        } : {},
      }}
      onClick={onClick}
    >
      {/* 앨범 커버 이미지 */}
      <Box
        sx={{
          position: "relative",
          mb: 2,
          width: "100%",
          aspectRatio: "1",
          borderRadius: 1,
          overflow: "hidden",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)",
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
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
              transition: "all 0.3s ease",
            }}
            image={album.coverImageUrl}
            alt={album.title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
        ) : null}
        {/* 기본 커버 이미지 또는 이미지 로딩 실패 시 표시할 UI */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: album.coverImageUrl
              ? "none"
              : "linear-gradient(135deg, #00ffff, #ff0080)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: album.coverImageUrl ? -1 : 1,
          }}
        >
          {!album.coverImageUrl && (
            <Album
              style={{
                fontSize: "2rem",
                color: "rgba(255, 255, 255, 0.8)",
              }}
            />
          )}
        </Box>
      </Box>

      {/* 앨범 제목 */}
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#FFFFFF",
          fontSize: "1.1rem",
          mb: 1,
        }}
      >
        {album.title || "제목 없음"}
      </Typography>

      {/* 앨범 설명 */}
      {album.description && (
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            mb: 1,
          }}
        >
          {album.description}
        </Typography>
      )}

      {/* 생성일 */}
      <Typography
        variant="body2"
        sx={{
          fontSize: "0.8rem",
          fontWeight: 400,
          color: "rgba(255, 255, 255, 0.5)",
          mb: 1,
        }}
      >
        {album.createdAt
          ? new Date(album.createdAt).toLocaleDateString("ko-KR")
          : "날짜 없음"}
      </Typography>

      {/* 사용자 정보 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Avatar
          src={album.user?.avatar || album.userProfileImageUrl}
          sx={{
            width: 20,
            height: 20,
            mr: 1,
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <Person sx={{ fontSize: 12 }} />
        </Avatar>
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.8rem",
            color: "rgba(255, 255, 255, 0.7)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {album.user?.nickname ||
            album.userNickname ||
            `사용자 ${album.userId}`}
        </Typography>
      </Box>

      {/* 앨범 통계 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.75rem",
            color: "rgba(255, 255, 255, 0.6)",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          ♫ {album.trackCount || 0}곡
        </Typography>
        {album.totalDuration && album.totalDuration > 0 && (
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.75rem",
              color: "rgba(255, 255, 255, 0.6)",
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            ⏱{" "}
            {Math.floor(album.totalDuration / 60)}분{" "}
            {album.totalDuration % 60}초
          </Typography>
        )}
      </Box>

      {/* 태그 */}
      {album.tags && album.tags.length > 0 && (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {album.tags.map((tag: string) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                backgroundColor: "rgba(0, 255, 255, 0.1)",
                color: "#00ffff",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AlbumFeedCard;
