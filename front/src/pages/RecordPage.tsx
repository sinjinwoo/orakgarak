/**
 * 녹음 스튜디오 메인 페이지
 * - 곡 검색, 예약 큐, 노래방 플레이어, 가사, 녹음 컨트롤, 시각화 컴포넌트들을 통합
 * - 3단 레이아웃으로 구성: 왼쪽(곡 관리), 중앙(녹음), 오른쪽(시각화)
 * - ReservationProvider로 예약 큐 상태를 전역 관리
 * - 반응형 디자인으로 다양한 화면 크기 지원
 */

import React, { useState } from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import SongSearchPanel from '../components/record/SongSearchPanel';
import ReservationQueue from '../components/record/ReservationQueue';
import KaraokePlayer from '../components/record/KaraokePlayer';
import LyricsPanel from '../components/record/LyricsPanel';
import RecordingControls from '../components/record/RecordingControls';
import PitchGraph from '../components/record/PitchGraph';
import VolumeVisualizer from '../components/record/VolumeVisualizer';
import { ReservationProvider } from '../contexts/ReservationContext';

const RecordPage: React.FC = () => {
  // 녹음 상태 관리
  const [isRecording, setIsRecording] = useState(false);
  return (
    // 예약 큐 상태를 전역으로 관리하는 Provider
    <ReservationProvider>
      <Box sx={{ flex: 1, backgroundColor: '#fafafa' }}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {/* 페이지 제목 */}
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: '#2c2c2c',
              mb: 3
            }}
          >
            녹음 스튜디오
          </Typography>
          
          {/* 3단 레이아웃: 반응형 Flexbox 사용 */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {/* 왼쪽 패널: 곡 검색 및 예약 큐 관리 */}
            <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 곡 검색 패널 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <SongSearchPanel />
                </Paper>
                {/* 예약 큐 패널 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <ReservationQueue />
                </Paper>
              </Box>
            </Box>

            {/* 중앙 패널: 메인 녹음 영역 */}
            <Box sx={{ flex: '2 1 400px', minWidth: '400px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 노래방 플레이어 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <KaraokePlayer />
                </Paper>
                
                {/* 가사 패널 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, minHeight: 200 }}>
                  <LyricsPanel />
                </Paper>
                
                {/* 녹음 컨트롤 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                  <RecordingControls onRecordingChange={setIsRecording} />
                </Paper>
              </Box>
            </Box>

            {/* 오른쪽 패널: 시각화 및 분석 */}
            <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* 피치 정확도 그래프 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, minHeight: 200 }}>
                  <PitchGraph isRecording={isRecording} />
                </Paper>
                
                {/* 실시간 볼륨 시각화 */}
                <Paper elevation={1} sx={{ p: 2, borderRadius: 2, minHeight: 150 }}>
                  <VolumeVisualizer isRecording={isRecording} />
                </Paper>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </ReservationProvider>
  );
};

export default RecordPage;
