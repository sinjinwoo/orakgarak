import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

const AnalysisSummary: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        분석 결과
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                음역대
              </Typography>
              <Typography variant="body2" color="text.secondary">
                최저음: 80 Hz<br />
                최고음: 400 Hz
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                음색 특성
              </Typography>
              <Typography variant="body2" color="text.secondary">
                톤: 따뜻함<br />
                발성: 안정적
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalysisSummary;
