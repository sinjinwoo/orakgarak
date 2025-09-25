import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  Alert,
  TextField,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';
import { LikeButton, FollowButton } from '../components/common';
import { useAlbumLike, useFollow } from '../hooks/useSocial';
import { socialService } from '../services/api/social';

const SocialToggleTestPage: React.FC = () => {
  const [testAlbumId, setTestAlbumId] = useState(1);
  const [testUserId, setTestUserId] = useState(1);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const { toggleLike, checkLikeStatus, getLikeCount, isLoading: likeLoading } = useAlbumLike();
  const { toggleFollow, checkFollowStatus, getFollowCount, isLoading: followLoading } = useFollow();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runLikeTests = async () => {
    setIsRunningTests(true);
    addTestResult('🧪 좋아요 토글 테스트 시작');

    try {
      // 1. 초기 상태 확인
      const initialStatus = await checkLikeStatus(testAlbumId);
      addTestResult(`초기 좋아요 상태: ${initialStatus?.isLiked ? '좋아요됨' : '좋아요 안됨'}`);

      const initialCount = await getLikeCount(testAlbumId);
      addTestResult(`초기 좋아요 수: ${initialCount?.count || 0}`);

      // 2. 토글 테스트
      const toggleResult = await toggleLike(testAlbumId);
      addTestResult(`토글 결과: ${toggleResult.success ? '성공' : '실패'} - ${toggleResult.message}`);
      addTestResult(`토글 후 상태: ${toggleResult.isLiked ? '좋아요됨' : '좋아요 취소됨'}`);

      // 3. 상태 재확인
      const afterStatus = await checkLikeStatus(testAlbumId);
      addTestResult(`토글 후 서버 상태: ${afterStatus?.isLiked ? '좋아요됨' : '좋아요 안됨'}`);

      const afterCount = await getLikeCount(testAlbumId);
      addTestResult(`토글 후 좋아요 수: ${afterCount?.count || 0}`);

      addTestResult('✅ 좋아요 토글 테스트 완료');
    } catch (error: any) {
      addTestResult(`❌ 좋아요 테스트 실패: ${error.message}`);
    }

    setIsRunningTests(false);
  };

  const runFollowTests = async () => {
    setIsRunningTests(true);
    addTestResult('🧪 팔로우 토글 테스트 시작');

    try {
      // 1. 초기 상태 확인
      const initialStatus = await checkFollowStatus(testUserId);
      addTestResult(`초기 팔로우 상태: ${initialStatus?.isFollowing ? '팔로우됨' : '팔로우 안됨'}`);

      const initialCount = await getFollowCount(testUserId);
      addTestResult(`초기 팔로워/팔로잉 수: ${initialCount?.followerCount || 0}/${initialCount?.followingCount || 0}`);

      // 2. 토글 테스트
      const toggleResult = await toggleFollow(testUserId);
      addTestResult(`토글 결과: ${toggleResult.success ? '성공' : '실패'} - ${toggleResult.message}`);
      addTestResult(`토글 후 상태: ${toggleResult.isFollowing ? '팔로우됨' : '언팔로우됨'}`);

      // 3. 상태 재확인
      const afterStatus = await checkFollowStatus(testUserId);
      addTestResult(`토글 후 서버 상태: ${afterStatus?.isFollowing ? '팔로우됨' : '팔로우 안됨'}`);

      const afterCount = await getFollowCount(testUserId);
      addTestResult(`토글 후 팔로워/팔로잉 수: ${afterCount?.followerCount || 0}/${afterCount?.followingCount || 0}`);

      addTestResult('✅ 팔로우 토글 테스트 완료');
    } catch (error: any) {
      addTestResult(`❌ 팔로우 테스트 실패: ${error.message}`);
    }

    setIsRunningTests(false);
  };

  const runDirectAPITests = async () => {
    setIsRunningTests(true);
    addTestResult('🧪 직접 API 테스트 시작');

    try {
      // 좋아요 API 직접 호출
      const likeToggleResult = await socialService.albums.toggleLike(testAlbumId);
      addTestResult(`직접 좋아요 토글: ${JSON.stringify(likeToggleResult)}`);

      // 팔로우 API 직접 호출
      const followToggleResult = await socialService.follow.toggleFollow(testUserId);
      addTestResult(`직접 팔로우 토글: ${JSON.stringify(followToggleResult)}`);

      addTestResult('✅ 직접 API 테스트 완료');
    } catch (error: any) {
      addTestResult(`❌ 직접 API 테스트 실패: ${error.message}`);
    }

    setIsRunningTests(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        소셜 토글 기능 테스트 페이지
      </Typography>

      <Grid container spacing={4}>
        {/* 테스트 컨트롤 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              테스트 설정
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="테스트할 앨범 ID"
                type="number"
                value={testAlbumId}
                onChange={(e) => setTestAlbumId(Number(e.target.value))}
                size="small"
              />

              <TextField
                label="테스트할 사용자 ID"
                type="number"
                value={testUserId}
                onChange={(e) => setTestUserId(Number(e.target.value))}
                size="small"
              />

              <Divider />

              <Typography variant="subtitle1" fontWeight="bold">
                컴포넌트 테스트
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">좋아요:</Typography>
                <LikeButton
                  albumId={testAlbumId}
                  onLikeChange={(isLiked) => addTestResult(`컴포넌트 좋아요 변경: ${isLiked ? '좋아요됨' : '취소됨'}`)}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">팔로우:</Typography>
                <FollowButton
                  userId={testUserId}
                  onFollowChange={(isFollowing) => addTestResult(`컴포넌트 팔로우 변경: ${isFollowing ? '팔로우됨' : '언팔로우됨'}`)}
                />
              </Box>

              <Divider />

              <Typography variant="subtitle1" fontWeight="bold">
                자동 테스트
              </Typography>

              <Button
                variant="contained"
                onClick={runLikeTests}
                disabled={isRunningTests || likeLoading}
                fullWidth
              >
                {likeLoading ? <CircularProgress size={20} /> : '좋아요 토글 테스트 실행'}
              </Button>

              <Button
                variant="contained"
                onClick={runFollowTests}
                disabled={isRunningTests || followLoading}
                fullWidth
              >
                {followLoading ? <CircularProgress size={20} /> : '팔로우 토글 테스트 실행'}
              </Button>

              <Button
                variant="outlined"
                onClick={runDirectAPITests}
                disabled={isRunningTests}
                fullWidth
              >
                직접 API 테스트 실행
              </Button>

              <Button
                variant="text"
                onClick={clearResults}
                color="secondary"
                fullWidth
              >
                결과 지우기
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* 테스트 결과 */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, maxHeight: 600, overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom>
              테스트 결과 ({testResults.length})
            </Typography>

            <Box sx={{
              maxHeight: 500,
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: 1,
              p: 2,
              backgroundColor: '#f5f5f5'
            }}>
              {testResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  테스트를 실행하면 결과가 여기에 표시됩니다.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {testResults.map((result, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        whiteSpace: 'pre-wrap',
                        color: result.includes('❌') ? 'error.main' :
                               result.includes('✅') ? 'success.main' :
                               result.includes('🧪') ? 'primary.main' : 'text.primary'
                      }}
                    >
                      {result}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 사용법 안내 */}
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          사용법
        </Typography>
        <Alert severity="info">
          <Typography variant="body2">
            1. 위에서 테스트할 앨범 ID와 사용자 ID를 설정합니다.<br/>
            2. 컴포넌트 테스트: 버튼을 직접 클릭해서 동작을 확인합니다.<br/>
            3. 자동 테스트: 버튼을 클릭하면 자동으로 API를 호출하고 결과를 확인합니다.<br/>
            4. 직접 API 테스트: socialService API를 직접 호출해서 raw 응답을 확인합니다.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default SocialToggleTestPage;