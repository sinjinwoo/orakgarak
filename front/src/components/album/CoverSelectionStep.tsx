import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Paper,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  AutoFixHigh,
  CloudUpload,
  CheckCircle,
  PlayArrow,
} from '@mui/icons-material';
import { theme, buttonStyles } from '../../styles/theme';

interface CoverSelectionStepProps {
  selectedRecordings: string[];
  onNext: () => void;
  onPrev: () => void;
  onCoverSelect: (coverUrl: string) => void;
}

// 더미 AI 생성 커버 이미지들
const dummyCovers = [
  {
    id: 1,
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    prompt: '감성적인 일러스트',
  },
  {
    id: 2,
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
    prompt: '빈티지 레코드 스타일',
  },
  {
    id: 3,
    url: 'https://images.unsplash.com/photo-1511379938547-c1f198198718?w=300&h=300&fit=crop',
    prompt: '미니멀한 음표 디자인',
  },
  {
    id: 4,
    url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    prompt: '네온사인 분위기',
  },
];

const recommendedPrompts = [
  '감성적인 일러스트',
  '빈티지 레코드 스타일',
  '미니멀한 음표 디자인',
  '네온사인 분위기',
  '수채화 터치',
];

const CoverSelectionStep: React.FC<CoverSelectionStepProps> = ({
  selectedRecordings,
  onNext,
  onPrev,
  onCoverSelect,
}) => {
  const [coverType, setCoverType] = useState<'ai' | 'upload'>('ai');
  const [stylePrompt, setStylePrompt] = useState('');
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  const handleCoverTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newCoverType: 'ai' | 'upload' | null,
  ) => {
    if (newCoverType !== null) {
      setCoverType(newCoverType);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompts(prev => 
      prev.includes(prompt) 
        ? prev.filter(p => p !== prompt)
        : [...prev, prompt]
    );
  };

  const handleCoverSelect = (coverUrl: string) => {
    setSelectedCover(coverUrl);
    onCoverSelect(coverUrl);
  };

  const handleGenerateCover = () => {
    // AI 커버 생성 로직 (현재는 더미 데이터 사용)
    console.log('Generating cover with prompt:', stylePrompt);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleCoverSelect(url);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <AutoFixHigh sx={{ fontSize: 48, color: '#C147E9' }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1, color: '#FFFFFF' }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 커버 선택 섹션 */}
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
          💡 앨범 커버 선택
        </Typography>
        <Typography variant="body2" sx={{ 
          mb: 3,
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          AI가 생성한 커버를 선택하거나 직접 업로드해주세요
        </Typography>

        {/* 커버 타입 선택 */}
        <ToggleButtonGroup
          value={coverType}
          exclusive
          onChange={handleCoverTypeChange}
          sx={{ mb: 3 }}
        >
          <ToggleButton value="ai" sx={{ px: 3, py: 1 }}>
            <AutoFixHigh sx={{ mr: 1 }} />
            AI 생성
          </ToggleButton>
          <ToggleButton value="upload" sx={{ px: 3, py: 1 }}>
            <CloudUpload sx={{ mr: 1 }} />
            직접 업로드
          </ToggleButton>
        </ToggleButtonGroup>

        {coverType === 'ai' ? (
          <>
            {/* 스타일 입력 */}
            <TextField
              fullWidth
              placeholder="원하는 스타일을 입력하세요"
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* 추천 프롬프트 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                추천 프롬프트
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {recommendedPrompts.map((prompt) => (
                  <Chip
                    key={prompt}
                    label={prompt}
                    clickable
                    onClick={() => handlePromptClick(prompt)}
                    variant={selectedPrompts.includes(prompt) ? 'filled' : 'outlined'}
                    sx={{
                      backgroundColor: selectedPrompts.includes(prompt) 
                        ? 'rgba(196, 71, 233, 0.2)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      color: selectedPrompts.includes(prompt) 
                        ? '#FFFFFF' 
                        : 'rgba(255, 255, 255, 0.7)',
                      borderColor: selectedPrompts.includes(prompt) 
                        ? '#C147E9' 
                        : 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        backgroundColor: selectedPrompts.includes(prompt) 
                          ? 'rgba(196, 71, 233, 0.3)' 
                          : 'rgba(255, 255, 255, 0.2)',
                        borderColor: '#C147E9',
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* AI 커버 생성 버튼 */}
            <Button
              variant="contained"
              startIcon={<AutoFixHigh />}
              onClick={handleGenerateCover}
              sx={{
                background: theme.colors.primary.gradient,
                color: 'white',
                mb: 3,
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
              }}
            >
              AI 커버 생성
            </Button>

            {/* 생성된 커버들 */}
            <Typography variant="h6" sx={{ 
              mb: 2,
              color: '#FFFFFF',
              fontWeight: 600
            }}>
              생성된 커버
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
              gap: 2
            }}>
              {dummyCovers.map((cover) => (
                <Box key={cover.id}>
                  <Card
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: selectedCover === cover.url 
                        ? '2px solid #C147E9' 
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(196, 71, 233, 0.3)',
                        borderColor: selectedCover === cover.url 
                          ? '#C147E9' 
                          : 'rgba(255, 255, 255, 0.4)',
                      },
                    }}
                    onClick={() => handleCoverSelect(cover.url)}
                  >
                    <CardMedia
                      component="img"
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                      image={cover.url}
                      alt={cover.prompt}
                    />
                    {selectedCover === cover.url && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(196, 71, 233, 0.9)',
                          borderRadius: '50%',
                          p: 0.5,
                          backdropFilter: 'blur(10px)',
                          boxShadow: '0 4px 15px rgba(196, 71, 233, 0.4)',
                        }}
                      >
                        <CheckCircle sx={{ color: 'white', fontSize: 16 }} />
                      </Box>
                    )}
                    
                    {/* 프롬프트 라벨 */}
                    <Box sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.8))',
                      p: 1,
                      pt: 2
                    }}>
                      <Typography variant="caption" sx={{
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        textAlign: 'center',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {cover.prompt}
                      </Typography>
                    </Box>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          /* 파일 업로드 */
          <Box
            sx={{
              border: '2px dashed rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#C147E9',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.7)', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: '#FFFFFF' }}>
              이미지 업로드
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
              JPG, PNG 파일을 업로드하세요 (최대 5MB)
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="cover-upload"
            />
            <label htmlFor="cover-upload">
              <Button
                variant="outlined"
                component="span"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    borderColor: '#C147E9',
                    backgroundColor: 'rgba(196, 71, 233, 0.1)',
                    color: '#FFFFFF',
                  },
                }}
              >
                파일 선택
              </Button>
            </label>
          </Box>
        )}
      </Paper>

      {/* 앨범에 포함된 곡 */}
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
          mb: 2,
          color: '#FFFFFF'
        }}>
          앨범에 포함된 곡
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {selectedRecordings.map((recordingId, index) => (
            <Box key={recordingId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 20 }}>
                {index + 1}.
              </Typography>
              <Typography variant="body2">
                녹음 {recordingId}
              </Typography>
            </Box>
          ))}
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
          disabled={!selectedCover}
          sx={{
            background: 'linear-gradient(135deg, #FF6B9D 0%, #C147E9 100%)',
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

export default CoverSelectionStep;
