import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Paper,
  Slider,
  Button
} from '@mui/material';
import { FilterList, Refresh } from '@mui/icons-material';
import type { RecommendationFilter } from '../../types/recommendation';

interface RecommendationFiltersProps {
  filter: RecommendationFilter;
  onFilterChange: (filter: RecommendationFilter) => void;
  onReset: () => void;
}

const RecommendationFilters: React.FC<RecommendationFiltersProps> = ({
  filter,
  onFilterChange,
  onReset
}) => {
  const [localFilter, setLocalFilter] = useState<RecommendationFilter>(filter);

  // 기분 태그 옵션
  const moodOptions = [
    '비', '추억', '친구', '회식', '운동', '드라이브', 
    '데이트', '혼자', '파티', '잠들기', '기분좋을때', '우울할때'
  ];

  // 장르 옵션
  const genreOptions = [
    { value: 'all', label: '전체' },
    { value: 'pop', label: '팝' },
    { value: 'rock', label: '록' },
    { value: 'ballad', label: '발라드' },
    { value: 'jazz', label: '재즈' },
    { value: 'indie', label: '인디' },
    { value: 'rnb', label: 'R&B' },
    { value: 'hiphop', label: '힙합' }
  ];

  // 난이도 옵션
  const difficultyOptions = [
    { value: 'all', label: '전체' },
    { value: 'easy', label: '쉬움' },
    { value: 'medium', label: '보통' },
    { value: 'hard', label: '어려움' }
  ];

  // 기분 태그 토글
  const handleMoodToggle = (mood: string) => {
    const newMoods = localFilter.mood.includes(mood)
      ? localFilter.mood.filter(m => m !== mood)
      : [...localFilter.mood, mood];
    
    setLocalFilter(prev => ({ ...prev, mood: newMoods }));
  };

  // 필터 적용
  const handleApplyFilter = () => {
    onFilterChange(localFilter);
  };

  // 필터 초기화
  const handleReset = () => {
    const resetFilter: RecommendationFilter = {
      genre: 'all',
      difficulty: 'all',
      mood: [],
      vocalRange: {
        min: 80,
        max: 500
      }
    };
    setLocalFilter(resetFilter);
    onReset();
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList />
          추천 필터
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={handleReset}
            startIcon={<Refresh />}
          >
            초기화
          </Button>
          <Button 
            variant="contained" 
            size="small"
            onClick={handleApplyFilter}
          >
            적용
          </Button>
        </Box>
      </Box>

      {/* 기분 태그 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          기분/상황
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {moodOptions.map((mood) => (
            <Chip
              key={mood}
              label={mood}
              onClick={() => handleMoodToggle(mood)}
              color={localFilter.mood.includes(mood) ? 'primary' : 'default'}
              variant={localFilter.mood.includes(mood) ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />
          ))}
        </Box>
      </Box>

      {/* 장르 및 난이도 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>장르</InputLabel>
          <Select
            value={localFilter.genre}
            label="장르"
            onChange={(e) => setLocalFilter(prev => ({ ...prev, genre: e.target.value }))}
          >
            {genreOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>난이도</InputLabel>
          <Select
            value={localFilter.difficulty}
            label="난이도"
            onChange={(e) => setLocalFilter(prev => ({ ...prev, difficulty: e.target.value }))}
          >
            {difficultyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 음역대 범위 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          음역대 범위 (Hz)
        </Typography>
        <Box sx={{ px: 2 }}>
          <Slider
            value={[localFilter.vocalRange.min, localFilter.vocalRange.max]}
            onChange={(_, newValue) => {
              const [min, max] = newValue as number[];
              setLocalFilter(prev => ({
                ...prev,
                vocalRange: { min, max }
              }));
            }}
            valueLabelDisplay="auto"
            min={50}
            max={600}
            step={10}
            marks={[
              { value: 50, label: '50Hz' },
              { value: 200, label: '200Hz' },
              { value: 400, label: '400Hz' },
              { value: 600, label: '600Hz' }
            ]}
            sx={{ color: 'primary.main' }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {localFilter.vocalRange.min}Hz
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {localFilter.vocalRange.max}Hz
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default RecommendationFilters;
