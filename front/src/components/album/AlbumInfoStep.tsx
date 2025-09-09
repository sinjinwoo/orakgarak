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
          <Typography sx={{ fontSize: 48, color: '#2c2c2c' }}>📄</Typography>
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" color="text.secondary">
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 앨범 정보 폼 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
          📄 앨범 정보
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          앨범의 기본 정보를 입력해주세요
        </Typography>

        {/* 앨범 제목 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            앨범 제목 *
          </Typography>
          <TextField
            fullWidth
            placeholder="앨범 제목을 입력하세요"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#2c2c2c',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2c2c2c',
                },
              },
            }}
          />
        </Box>

        {/* 앨범 설명 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
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
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#e0e0e0',
                },
                '&:hover fieldset': {
                  borderColor: '#2c2c2c',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2c2c2c',
                },
              },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {description.length} / 500자
          </Typography>
        </Box>


        {/* 공개 설정 */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 2 }}>
            공개 설정
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => onIsPublicChange(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2c2c2c',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#2c2c2c',
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  공개 앨범
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  다른 사용자들이 내 앨범을 볼 수 있습니다
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', mb: 1 }}
          />
          {!isPublic && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 4 }}>
              <Lock sx={{ fontSize: 16, color: '#666' }} />
              <Typography variant="body2" color="text.secondary">
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
            borderColor: '#2c2c2c',
            color: '#2c2c2c',
            '&:hover': {
              borderColor: '#1a1a1a',
              backgroundColor: '#f5f5f5',
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
            backgroundColor: '#2c2c2c',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1a1a1a',
            },
            '&:disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e',
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
