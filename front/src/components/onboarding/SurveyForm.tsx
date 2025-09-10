import React from 'react';
import { Box, Typography, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Chip, TextField } from '@mui/material';
import { useOnboardingStore } from '../../stores/onboardingStore';

const SurveyForm: React.FC = () => {
  const { gender, preferredGenres, favoriteSongs, setGender, setPreferredGenres } = useOnboardingStore();

  const genres = ['팝', '락', '발라드', 'R&B', '힙합', '재즈', '클래식', 'K-POP', 'J-POP', 'OST'];

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        음악 취향 설문
      </Typography>
      
      {/* 성별 선택 */}
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <FormLabel component="legend">성별</FormLabel>
        <RadioGroup
          value={gender || ''}
          onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
        >
          <FormControlLabel value="male" control={<Radio />} label="남성" />
          <FormControlLabel value="female" control={<Radio />} label="여성" />
          <FormControlLabel value="other" control={<Radio />} label="기타" />
        </RadioGroup>
      </FormControl>

      {/* 선호 장르 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          선호하는 장르 (복수 선택 가능)
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {genres.map((genre) => (
            <Chip
              key={genre}
              label={genre}
              clickable
              color={preferredGenres.includes(genre) ? 'primary' : 'default'}
              onClick={() => {
                if (preferredGenres.includes(genre)) {
                  setPreferredGenres(preferredGenres.filter(g => g !== genre));
                } else {
                  setPreferredGenres([...preferredGenres, genre]);
                }
              }}
            />
          ))}
        </Box>
      </Box>

      {/* 애창곡 입력 */}
      <TextField
        fullWidth
        label="애창곡 (선택사항)"
        placeholder="좋아하는 곡을 입력해주세요"
        multiline
        rows={3}
        sx={{ mb: 3 }}
      />
    </Box>
  );
};

export default SurveyForm;
