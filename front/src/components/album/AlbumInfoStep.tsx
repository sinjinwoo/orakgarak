import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Lock } from '@mui/icons-material';
import { theme, buttonStyles } from '../../styles/theme';

interface AlbumInfoStepProps {
  title: string;
  description: string;
  isPublic: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onIsPublicChange: (isPublic: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

const AlbumInfoStep: React.FC<AlbumInfoStepProps> = ({
  title,
  description,
  isPublic,
  onTitleChange,
  onDescriptionChange,
  onIsPublicChange,
  onNext,
  onPrev,
}) => {

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: 48, color: '#C147E9' }}>📄</Typography>
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 앨범 정보 폼 */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: 'transparent',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 600, 
          mb: 1, 
          display: 'flex', 
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          📄 앨범 정보
        </Typography>
        <Typography variant="body2" sx={{ 
          mb: 3,
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          앨범의 기본 정보를 입력해주세요
        </Typography>

        {/* 앨범 제목 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#FFFFFF' }}>
            앨범 제목 *
          </Typography>
          <TextField
            fullWidth
            placeholder="앨범 제목을 입력하세요"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                color: '#FFFFFF',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#C147E9',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.6)',
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* 앨범 설명 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#FFFFFF' }}>
            앨범 설명
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="이 앨범에 대해 설명해주세요 (선택사항)"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                color: '#FFFFFF',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#C147E9',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.6)',
                opacity: 1,
              },
            }}
          />
          <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'rgba(255, 255, 255, 0.6)' }}>
            {description.length} / 500자
          </Typography>
        </Box>


        {/* 공개 설정 */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 2, color: '#FFFFFF' }}>
            공개 설정
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => onIsPublicChange(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#C147E9',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#C147E9',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
                  공개 앨범
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  다른 사용자들이 내 앨범을 볼 수 있습니다
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 1 }}
          />
          {!isPublic && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
              <Lock sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' }} />
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                비공개 앨범은 나만 볼 수 있습니다
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* 네비게이션 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          onClick={onPrev}
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#C147E9',
              backgroundColor: 'rgba(196, 71, 233, 0.1)',
              color: '#FFFFFF',
            },
          }}
        >
          ← 이전 단계
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!title.trim()}
          sx={{
            background: theme.colors.primary.gradient,
            color: 'white',
            borderRadius: 2,
            px: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(196, 71, 233, 0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #FF7BA7 0%, #C951EA 100%)',
              boxShadow: '0 6px 20px rgba(196, 71, 233, 0.6)',
              transform: 'translateY(-2px)'
            },
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.3)',
              boxShadow: 'none',
              transform: 'none',
            },
          }}
        >
          다음 단계 →
        </Button>
      </Box>
    </Box>
  );
};

export default AlbumInfoStep;
