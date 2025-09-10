import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AuthGuard from '../components/auth/AuthGuard';

// Lazy loading으로 페이지 컴포넌트들 import
const LandingPage = React.lazy(() => import('../pages/LandingPage'));
const OnboardingRangePage = React.lazy(() => import('../pages/OnboardingRangePage'));
const RecommendationsPage = React.lazy(() => import('../pages/RecommendationsPage'));
const RecordPage = React.lazy(() => import('../pages/RecordPage'));
const AlbumCreatePage = React.lazy(() => import('../pages/AlbumCreatePage'));
const AlbumDetailPage = React.lazy(() => import('../pages/AlbumDetailPage'));
const FeedPage = React.lazy(() => import('../pages/FeedPage'));
const AIDemoPage = React.lazy(() => import('../pages/AIDemoPage'));
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
        {/* 랜딩 페이지 - 인증 불필요 */}
        <Route path="/" element={<LandingPage />} />
        
        {/* 인증이 필요한 모든 페이지들 */}
        <Route path="/onboarding/range" element={
          <AuthGuard>
            <OnboardingRangePage />
          </AuthGuard>
        } />
        
        <Route path="/recommendations" element={
          <AuthGuard>
            <RecommendationsPage />
          </AuthGuard>
        } />
        
        <Route path="/record" element={
          <AuthGuard>
            <RecordPage />
          </AuthGuard>
        } />
        
        <Route path="/albums/create" element={
          <AuthGuard>
            <AlbumCreatePage />
          </AuthGuard>
        } />
        
        <Route path="/albums/:albumId" element={
          <AuthGuard>
            <AlbumDetailPage />
          </AuthGuard>
        } />
        
        <Route path="/albums/:albumId/edit" element={
          <AuthGuard>
            <AlbumCreatePage />
          </AuthGuard>
        } />
        
        <Route path="/feed" element={
          <AuthGuard>
            <FeedPage />
          </AuthGuard>
        } />
        
        <Route path="/users/:userId" element={
          <AuthGuard>
            <MyPage />
          </AuthGuard>
        } />
        
        <Route path="/ai-demo" element={
          <AuthGuard>
            <AIDemoPage />
          </AuthGuard>
        } />
        
        <Route path="/me" element={
          <AuthGuard>
            <MyPage />
          </AuthGuard>
        } />
        
        <Route path="/me/recordings" element={
          <AuthGuard>
            <MyPage />
          </AuthGuard>
        } />
        
        <Route path="/me/albums" element={
          <AuthGuard>
            <MyPage />
          </AuthGuard>
        } />
        
        <Route path="/me/ai-covers" element={
          <AuthGuard>
            <MyPage />
          </AuthGuard>
        } />
        
        <Route path="/me/edit" element={
          <AuthGuard>
            <MyPage />
          </AuthGuard>
        } />
        
        {/* 404 - 인증 불필요 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};
