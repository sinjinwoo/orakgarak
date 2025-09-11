import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  IconButton
} from '@mui/material';
import { 
  PlayArrow, 
  Bookmark, 
  BookmarkBorder
} from '@mui/icons-material';
import type { RecommendedSong } from '../../types/recommendation';

interface SongCardProps {
  song: RecommendedSong;
  isSelected?: boolean;
  isBookmarked?: boolean;
  onSelect?: (song: RecommendedSong) => void;
  onBookmark?: (song: RecommendedSong) => void;
  onReserve?: (song: RecommendedSong) => void;
}

const SongCard: React.FC<SongCardProps> = ({
  song,
  isSelected = false,
  isBookmarked = false,
  onSelect,
  onBookmark
}) => {
  return (
     <Card 
       sx={{ 
         width: 240,
         height: 320,
        cursor: 'pointer',
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)'
          : 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%)',
        border: isSelected 
          ? '3px solid rgba(139, 92, 246, 0.8)' 
          : '2px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.05) translateY(-10px)' : 'scale(1)',
        boxShadow: isSelected 
          ? '0 20px 40px rgba(139, 92, 246, 0.4)' 
          : '0 8px 25px rgba(0, 0, 0, 0.3)',
        '&:hover': {
          transform: 'scale(1.08) translateY(-15px)',
          boxShadow: '0 25px 50px rgba(139, 92, 246, 0.5)',
          border: '3px solid rgba(139, 92, 246, 0.6)',
        }
      }}
      onClick={() => onSelect?.(song)}
    >
      {/* 배경 패턴 */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
        `,
        zIndex: 0
      }} />
      
      <CardContent sx={{ 
        p: 0, 
        height: '100%', 
        position: 'relative', 
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
         {/* 앨범 커버 */}
         <Box sx={{ 
           position: 'relative',
           height: 160,
          backgroundImage: `url(${song.coverImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden'
        }}>
          {/* 그라데이션 오버레이 */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
            zIndex: 1
          }} />
          
           {/* 재생 버튼 */}
           <IconButton 
             sx={{ 
               position: 'absolute',
               top: '50%',
               left: '50%',
               transform: 'translate(-50%, -50%)',
               background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
               color: 'white',
               width: 50,
               height: 50,
               borderRadius: '50%',
               boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
               zIndex: 2,
               opacity: 0.9,
               '&:hover': {
                 background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                 transform: 'translate(-50%, -50%) scale(1.1)',
                 boxShadow: '0 12px 30px rgba(139, 92, 246, 0.6)',
                 opacity: 1
               },
               transition: 'all 0.3s ease'
             }}
           >
             <PlayArrow sx={{ fontSize: '1.5rem' }} />
           </IconButton>

          {/* 매칭 점수 */}
          <Box sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '20px',
            px: 2,
            py: 1,
            zIndex: 2
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              {song.matchScore}%
            </Typography>
          </Box>

          {/* 북마크 버튼 */}
          <IconButton 
            sx={{ 
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(0, 0, 0, 0.5)',
              color: isBookmarked ? '#ffd700' : '#fff',
              width: 40,
              height: 40,
              borderRadius: '50%',
              zIndex: 2,
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.7)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.(song);
            }}
          >
            {isBookmarked ? <Bookmark sx={{ fontSize: '1.2rem' }} /> : <BookmarkBorder sx={{ fontSize: '1.2rem' }} />}
          </IconButton>
        </Box>

         {/* 곡 정보 */}
         <Box sx={{ 
           flex: 1, 
           p: 2, 
           display: 'flex', 
           flexDirection: 'column',
           justifyContent: 'center',
           alignItems: 'center',
           textAlign: 'center'
         }}>
           {/* 제목과 아티스트 */}
           <Typography 
             variant="h6" 
             sx={{ 
               fontWeight: 'bold',
               mb: 1,
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
               color: '#fff',
               fontSize: '1rem',
               lineHeight: 1.2,
               width: '100%'
             }}
           >
             {song.title}
           </Typography>
           <Typography 
             variant="body2" 
             sx={{ 
               overflow: 'hidden',
               textOverflow: 'ellipsis',
               whiteSpace: 'nowrap',
               color: '#a78bfa',
               fontWeight: 400,
               fontSize: '0.85rem',
               width: '100%'
             }}
           >
             {song.artist}
           </Typography>

           {/* 선택 표시 */}
           {isSelected && (
             <Box sx={{
               background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
               borderRadius: '8px',
               p: 0.5,
               mt: 1,
               minWidth: 60
             }}>
               <Typography 
                 variant="body2" 
                 sx={{ 
                   color: 'white',
                   fontWeight: 'bold',
                   fontSize: '0.7rem'
                 }}
               >
                 SELECTED
               </Typography>
             </Box>
           )}
         </Box>
      </CardContent>
    </Card>
  );
};

export default SongCard;
