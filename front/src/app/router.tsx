import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

// Lazy loading으로 페이지 컴포넌트들 import
const LandingPage = React.lazy(() => import('../pages/LandingPage'));
const OnboardingSurveyPage = React.lazy(() => import('../pages/OnboardingSurveyPage'));
const OnboardingRangePage = React.lazy(() => import('../pages/OnboardingRangePage'));
const RecommendationsPage = React.lazy(() => import('../pages/RecommendationsPage'));
const RecordPage = React.lazy(() => import('../pages/RecordPage'));
const AlbumCreatePage = React.lazy(() => import('../pages/AlbumCreatePage'));
const AlbumDetailPage = React.lazy(() => import('../pages/AlbumDetailPage'));
const FeedPage = React.lazy(() => import('../pages/FeedPage'));
const MyPage = React.lazy(() => import('../pages/MyPage'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

const LoadingSpinner = () => (
  <Box 
    display="flex" 
    justifyContent="center" 
    alignItems="center" 
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* 랜딩 페이지 */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 온보딩 */}
        <Route path="/onboarding/survey" element={<OnboardingSurveyPage />} />
        <Route path="/onboarding/range" element={<OnboardingRangePage />} />
        
        {/* 추천 */}
        <Route path="/recommendations" element={<RecommendationsPage />} />
        
        {/* 녹음 */}
        <Route path="/record" element={<RecordPage />} />
        
        {/* 앨범 */}
        <Route path="/albums/create" element={<AlbumCreatePage />} />
        <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
        <Route path="/albums/:albumId/edit" element={<AlbumCreatePage />} />
        
        {/* 피드 */}
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/users/:userId" element={<MyPage />} />
        
        {/* 마이페이지 */}
        <Route path="/me" element={<MyPage />} />
        <Route path="/me/recordings" element={<MyPage />} />
        <Route path="/me/albums" element={<MyPage />} />
        <Route path="/me/ai-covers" element={<MyPage />} />
        <Route path="/me/edit" element={<MyPage />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
