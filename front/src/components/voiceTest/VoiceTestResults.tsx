import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Grid,
  Divider,
  Button
} from '@mui/material';
import {
  Mic,
  MusicNote,
  TrendingUp,
  VolumeUp,
  Vibration,
  Brightness4,
  Psychology,
  ArrowForward
} from '@mui/icons-material';
import type { VoiceAnalysis } from '../../types/voiceAnalysis';

interface VoiceTestResultsProps {
  analysis: VoiceAnalysis;
  onClose: () => void;
}

const VoiceTestResults: React.FC<VoiceTestResultsProps> = ({ analysis, onClose }) => {
  // 음역대 범위를 시각화하기 위한 함수
  const getRangeVisualization = () => {
    const { min, max, comfortable } = analysis.vocalRange;
    const totalRange = max - min;
    const comfortableRange = comfortable.max - comfortable.min;
    
    return {
      totalRange,
      comfortableRange,
      minPercent: 0,
      maxPercent: 100,
      comfortableMinPercent: ((comfortable.min - min) / totalRange) * 100,
      comfortableMaxPercent: ((comfortable.max - min) / totalRange) * 100
    };
  };

  const rangeViz = getRangeVisualization();

  // 음색 특성을 시각화하기 위한 함수
  const getCharacteristicColor = (value: number) => {
    if (value >= 80) return '#4caf50'; // 녹색 (높음)
    if (value >= 60) return '#ff9800'; // 주황색 (보통)
    if (value >= 40) return '#ffc107'; // 노란색 (낮음)
    return '#f44336'; // 빨간색 (매우 낮음)
  };

  const getCharacteristicLabel = (value: number) => {
    if (value >= 80) return '높음';
    if (value >= 60) return '보통';
    if (value >= 40) return '낮음';
    return '매우 낮음';
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          🎤 음성 분석 결과
        </Typography>
        <Typography variant="body1" color="text.secondary">
          당신의 목소리 특성을 분석했습니다
        </Typography>
      </Box>

      {/* 전체 신뢰도 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#e8f5e8' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <TrendingUp color="success" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            분석 신뢰도
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LinearProgress
            variant="determinate"
            value={analysis.confidence}
            sx={{ flex: 1, height: 12, borderRadius: 6 }}
            color={analysis.confidence >= 80 ? 'success' : analysis.confidence >= 60 ? 'warning' : 'error'}
          />
          <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 60 }}>
            {Math.round(analysis.confidence)}%
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {analysis.confidence >= 80 
            ? '매우 정확한 분석 결과입니다' 
            : analysis.confidence >= 60 
            ? '신뢰할 만한 분석 결과입니다' 
            : '추가 테스트를 권장합니다'
          }
        </Typography>
      </Paper>

      {/* 음역대 분석 */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <MusicNote color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              음역대 분석
            </Typography>
          </Box>
          
          {/* 음역대 시각화 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative', height: 60, backgroundColor: '#f5f5f5', borderRadius: 2, p: 2 }}>
              {/* 전체 음역대 */}
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: 0, 
                right: 0, 
                height: 8, 
                backgroundColor: '#e0e0e0', 
                borderRadius: 4,
                transform: 'translateY(-50%)'
              }} />
              
              {/* 편안한 음역대 */}
              <Box sx={{ 
                position: 'absolute', 
                top: '50%', 
                left: `${rangeViz.comfortableMinPercent}%`, 
                width: `${rangeViz.comfortableMaxPercent - rangeViz.comfortableMinPercent}%`, 
                height: 8, 
                backgroundColor: '#4caf50', 
                borderRadius: 4,
                transform: 'translateY(-50%)'
              }} />
              
              {/* 레이블 */}
              <Box sx={{ position: 'absolute', top: -25, left: 0, right: 0, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(analysis.vocalRange.min)}Hz
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(analysis.vocalRange.max)}Hz
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 음역대 정보 */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  전체 음역대
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {Math.round(analysis.vocalRange.min)}Hz - {Math.round(analysis.vocalRange.max)}Hz
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(rangeViz.totalRange)}Hz 범위
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#e8f5e8', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  편안한 음역대
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {Math.round(analysis.vocalRange.comfortable.min)}Hz - {Math.round(analysis.vocalRange.comfortable.max)}Hz
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(rangeViz.comfortableRange)}Hz 범위
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  음역대 폭
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {Math.round(rangeViz.totalRange)}Hz
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {rangeViz.totalRange >= 200 ? '넓음' : rangeViz.totalRange >= 150 ? '보통' : '좁음'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 음색 특성 분석 */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Mic color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              음색 특성 분석
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <VolumeUp fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    음높이 변화
                  </Typography>
                  <Chip 
                    label={getCharacteristicLabel(analysis.vocalCharacteristics.pitchVariation)}
                    size="small"
                    sx={{ 
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.pitchVariation),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analysis.vocalCharacteristics.pitchVariation}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.pitchVariation)
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(analysis.vocalCharacteristics.pitchVariation)}% - 
                  {analysis.vocalCharacteristics.pitchVariation >= 70 ? ' 표현력이 풍부합니다' : 
                   analysis.vocalCharacteristics.pitchVariation >= 40 ? ' 적당한 변화를 보입니다' : 
                   ' 안정적인 음높이를 유지합니다'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Vibration fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    비브라토
                  </Typography>
                  <Chip 
                    label={getCharacteristicLabel(analysis.vocalCharacteristics.vibrato)}
                    size="small"
                    sx={{ 
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.vibrato),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analysis.vocalCharacteristics.vibrato}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.vibrato)
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(analysis.vocalCharacteristics.vibrato)}% - 
                  {analysis.vocalCharacteristics.vibrato >= 70 ? ' 풍부한 비브라토를 보입니다' : 
                   analysis.vocalCharacteristics.vibrato >= 40 ? ' 적당한 비브라토를 보입니다' : 
                   ' 깔끔한 음색을 보입니다'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Psychology fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    숨소리
                  </Typography>
                  <Chip 
                    label={getCharacteristicLabel(analysis.vocalCharacteristics.breathiness)}
                    size="small"
                    sx={{ 
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.breathiness),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analysis.vocalCharacteristics.breathiness}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.breathiness)
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(analysis.vocalCharacteristics.breathiness)}% - 
                  {analysis.vocalCharacteristics.breathiness >= 70 ? ' 감성적인 숨소리를 보입니다' : 
                   analysis.vocalCharacteristics.breathiness >= 40 ? ' 적당한 숨소리를 보입니다' : 
                   ' 깔끔한 발성을 보입니다'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Brightness4 fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    음색 밝기
                  </Typography>
                  <Chip 
                    label={getCharacteristicLabel(analysis.vocalCharacteristics.brightness)}
                    size="small"
                    sx={{ 
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.brightness),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={analysis.vocalCharacteristics.brightness}
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: getCharacteristicColor(analysis.vocalCharacteristics.brightness)
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {Math.round(analysis.vocalCharacteristics.brightness)}% - 
                  {analysis.vocalCharacteristics.brightness >= 70 ? ' 밝고 선명한 음색입니다' : 
                   analysis.vocalCharacteristics.brightness >= 40 ? ' 적당한 밝기를 보입니다' : 
                   ' 따뜻하고 부드러운 음색입니다'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 추천 정보 */}
      <Paper elevation={2} sx={{ p: 3, backgroundColor: '#f0f8ff' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
          🎵 맞춤 추천 정보
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          이 분석 결과를 바탕으로 당신에게 맞는 곡을 추천해드립니다
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${Math.round(analysis.vocalRange.comfortable.min)}-${Math.round(analysis.vocalRange.comfortable.max)}Hz 음역대`}
            color="primary"
            variant="outlined"
          />
          <Chip 
            label={analysis.vocalCharacteristics.pitchVariation >= 70 ? '표현력 풍부' : '안정적 발성'}
            color="secondary"
            variant="outlined"
          />
          <Chip 
            label={analysis.vocalCharacteristics.brightness >= 70 ? '밝은 음색' : '따뜻한 음색'}
            color="success"
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* 닫기 버튼 */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={onClose}
          endIcon={<ArrowForward />}
          sx={{ minWidth: 200, height: 50, fontSize: '1.1rem' }}
        >
          추천 곡 보러가기
        </Button>
      </Box>
    </Box>
  );
};

export default VoiceTestResults;
