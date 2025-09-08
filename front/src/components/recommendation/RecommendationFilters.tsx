import React from 'react';
import { Box, Typography, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const RecommendationFilters: React.FC = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        추천 필터
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip label="비" color="primary" />
        <Chip label="추억" />
        <Chip label="친구" />
        <Chip label="회식" />
      </Box>
      
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>장르</InputLabel>
        <Select value="" label="장르">
          <MenuItem value="pop">팝</MenuItem>
          <MenuItem value="rock">락</MenuItem>
          <MenuItem value="ballad">발라드</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default RecommendationFilters;
