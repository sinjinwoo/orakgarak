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
          <AutoFixHigh sx={{ fontSize: 48, color: '#2c2c2c' }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" color="text.secondary">
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 커버 선택 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
          💡 앨범 커버 선택
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                      backgroundColor: selectedPrompts.includes(prompt) ? '#2c2c2c' : 'transparent',
                      color: selectedPrompts.includes(prompt) ? 'white' : '#2c2c2c',
                      borderColor: '#2c2c2c',
                      '&:hover': {
                        backgroundColor: selectedPrompts.includes(prompt) ? '#1a1a1a' : '#f5f5f5',
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
                backgroundColor: '#2c2c2c',
                color: 'white',
                mb: 3,
                '&:hover': {
                  backgroundColor: '#1a1a1a',
                },
              }}
            >
              AI 커버 생성
            </Button>

            {/* 생성된 커버들 */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              생성된 커버
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {dummyCovers.map((cover) => (
                <Box sx={{ width: { xs: '50%', sm: '25%' }, p: 1 }} key={cover.id}>
                  <Card
                    sx={{
                      position: 'relative',
                      cursor: 'pointer',
                      border: selectedCover === cover.url ? '2px solid #2c2c2c' : '1px solid #e0e0e0',
                      '&:hover': {
                        boxShadow: 3,
                      },
                    }}
                    onClick={() => handleCoverSelect(cover.url)}
                  >
                    <CardMedia
                      component="img"
                      height="150"
                      image={cover.url}
                      alt={cover.prompt}
                    />
                    {selectedCover === cover.url && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: '#2c2c2c',
                          borderRadius: '50%',
                          p: 0.5,
                        }}
                      >
                        <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    )}
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        ) : (
          /* 파일 업로드 */
          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#2c2c2c',
                backgroundColor: '#f9f9f9',
              },
            }}
          >
            <CloudUpload sx={{ fontSize: 48, color: '#666', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              이미지 업로드
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                  borderColor: '#2c2c2c',
                  color: '#2c2c2c',
                  '&:hover': {
                    borderColor: '#1a1a1a',
                    backgroundColor: '#f5f5f5',
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
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
          disabled={!selectedCover}
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

export default CoverSelectionStep;
