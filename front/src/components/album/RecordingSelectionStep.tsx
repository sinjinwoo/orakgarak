import React from 'react';
import {
  Box,
  Typography,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  IconButton,
  Paper,
} from '@mui/material';
import { MusicNote, PlayArrow, Pause } from '@mui/icons-material';
// 임시로 Recording 타입을 직접 정의
interface Recording {
  id: string;
  userId: string;
  songId: string;
  song: {
    title: string;
    artist: string;
  };
  audioUrl: string;
  duration: number;
  createdAt: string;
  analysis?: {
    pitchAccuracy: number;
    tempoAccuracy: number;
    vocalRange: {
      min: number;
      max: number;
    };
    toneAnalysis: {
      brightness: number;
      warmth: number;
      clarity: number;
    };
    overallScore: number;
    feedback: string[];
  };
}

interface RecordingSelectionStepProps {
  recordings: Recording[];
  selectedRecordings: string[];
  onToggleRecording: (recordingId: string) => void;
  onSelectAll: () => void;
  onNext: () => void;
}

const RecordingSelectionStep: React.FC<RecordingSelectionStepProps> = ({
  recordings,
  selectedRecordings,
  onToggleRecording,
  onSelectAll,
  onNext,
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#4caf50';
    if (score >= 80) return '#2196f3';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const getQualityChip = (score: number) => {
    if (score >= 90) return { label: '높음', color: '#4caf50' };
    if (score >= 80) return { label: '보통', color: '#ff9800' };
    return { label: '중간', color: '#9e9e9e' };
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).replace(/\./g, '. ').replace(/\.$/, '.');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <MusicNote sx={{ fontSize: 48, color: '#2c2c2c' }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          새 앨범 만들기
        </Typography>
        <Typography variant="body1" color="text.secondary">
          녹음본으로 나만의 앨범을 만들어보세요
        </Typography>
      </Box>

      {/* 녹음 선택 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            ♫ 녹음 선택
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {selectedRecordings.length}곡 선택됨
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={onSelectAll}
              disabled={selectedRecordings.length === recordings.length}
            >
              전체 선택
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          앨범에 포함할 녹음을 선택해주세요 (최소 1곡, 최대 10곡)
        </Typography>

        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {recordings.map((recording) => {
            const isSelected = selectedRecordings.includes(recording.id);
            const quality = getQualityChip(recording.analysis?.overallScore || 0);
            
            return (
              <ListItem
                key={recording.id}
                disablePadding
                sx={{
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                <ListItemButton
                  onClick={() => onToggleRecording(recording.id)}
                  sx={{ py: 2, px: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleRecording(recording.id)}
                      sx={{ p: 0.5 }}
                    />
                  </ListItemIcon>
                  
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <MusicNote sx={{ color: '#666' }} />
                  </ListItemIcon>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {recording.song.title} - {recording.song.artist}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={quality.label}
                        size="small"
                        sx={{
                          backgroundColor: quality.color,
                          color: 'white',
                          fontSize: '0.75rem',
                          height: 20,
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatDuration(recording.duration)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(recording.createdAt)}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: getScoreColor(recording.analysis?.overallScore || 0),
                          fontWeight: 600,
                        }}
                      >
                        {recording.analysis?.overallScore || 0}점
                      </Typography>
                    </Box>
                  </Box>
                  
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <IconButton size="small">
                      <PlayArrow sx={{ color: '#666' }} />
                    </IconButton>
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Paper>

      {/* 다음 단계 버튼 */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          onClick={onNext}
          disabled={selectedRecordings.length === 0}
          sx={{
            backgroundColor: '#2c2c2c',
            color: 'white',
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
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

export default RecordingSelectionStep;
