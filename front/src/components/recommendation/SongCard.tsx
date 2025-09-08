import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';

const SongCard: React.FC = () => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          곡 제목
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          아티스트명
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          추천 이유: 음역대가 잘 맞습니다
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" size="small">
            예약
          </Button>
          <Button variant="outlined" size="small">
            저장
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SongCard;
