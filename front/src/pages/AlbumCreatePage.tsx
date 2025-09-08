import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AlbumCreatePage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          앨범 생성
        </Typography>
        <Typography variant="body1" color="text.secondary">
          앨범 생성 페이지가 여기에 구현됩니다.
        </Typography>
      </Box>
    </Container>
  );
};

export default AlbumCreatePage;
