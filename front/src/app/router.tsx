import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import AuthGuard from '../components/auth/AuthGuard';

// Lazy loading으로 페이지 컴포넌트들 import (에러 처리 추가)
const LandingPage = React.lazy(() => import('../pages/LandingPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const OnboardingRangePage = React.lazy(() => import('../pages/OnboardingRangePage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const RecommendationsPage = React.lazy(() => import('../pages/RecommendationsPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const VoiceTestPage = React.lazy(() => import('../pages/VoiceTestPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const RecordPage = React.lazy(() => import('../pages/RecordPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const AlbumCreatePage = React.lazy(() => import('../pages/AlbumCreatePage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const AlbumDetailPage = React.lazy(() => import('../pages/AlbumDetailPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const FeedPage = React.lazy(() => import('../pages/FeedPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const AIDemoPage = React.lazy(() => import('../pages/AIDemoPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const MyPage = React.lazy(() => import('../pages/MyPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));
const LoginSuccessPage = React.lazy(() => import('../pages/LoginSuccessPage').catch(() => ({ default: () => <div>페이지를 불러올 수 없습니다.</div> })));

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
        
        {/* 구글 로그인 성공 페이지 - 인증 불필요 */}
        <Route path="/login/success" element={<LoginSuccessPage />} />
        
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
        
        <Route path="/voice-test" element={
          <AuthGuard>
            <VoiceTestPage />
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
        
        <Route path="/albums/:albumId/edit" element={
          <AuthGuard>
            <AlbumCreatePage />
          </AuthGuard>
        } />
        
        <Route path="/albums/:albumId" element={
          <AuthGuard>
            <AlbumDetailPage />
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
