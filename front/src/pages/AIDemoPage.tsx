import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  Checkbox, 
  FormControlLabel,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  PlayArrow, 
  Pause,
  Stop, 
  MusicNote, 
  YouTube, 
  CheckCircle, 
  Pending, 
  Cancel,
  Warning,
  Add,
  Remove
} from '@mui/icons-material';
import { recordingService } from '../services/api/recordings';
import { aiDemoService } from '../services/aiDemo';
import type { Recording } from '../types/recording';
import type { AIDemoApplication, AIDemoRecord } from '../services/aiDemo';

const cyberpunkStyles = `
    @keyframes hologramScan {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    @keyframes pulseGlow {
      0% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
      100% { text-shadow: 0 0 30px currentColor, 0 0 60px currentColor; }
    }
    @keyframes statusPulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }
  `;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-demo-tabpanel-${index}`}
      aria-labelledby={`ai-demo-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AIDemoPage: React.FC = () => {
  // 기본 상태
  const [tabValue, setTabValue] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  // 신청 관련 상태
  const [myRecordings, setMyRecordings] = useState<Recording[]>([]);
  const [selectedRecordings, setSelectedRecordings] = useState<number[]>([]);
  const [youtubeLinks, setYoutubeLinks] = useState<string[]>(['']);
  const [totalDuration, setTotalDuration] = useState(0);

  // 신청 목록 및 결과
  const [myApplications, setMyApplications] = useState<AIDemoApplication[]>([]);
  const [myDemoRecords, setMyDemoRecords] = useState<AIDemoRecord[]>([]);

  // 오디오 재생 관련
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // 오디오 ref
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    loadData();
    return () => clearTimeout(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 내 녹음본 목록 조회
      const recordings = await recordingService.getMyRecordings();
      setMyRecordings(recordings);

      // 내 AI 데모 신청 목록 조회
      const applications = await aiDemoService.getMyApplications();
      setMyApplications(applications);

      // 내 AI 데모 파일 조회
      const demoRecords = await aiDemoService.getMyDemoRecords();
      setMyDemoRecords(demoRecords);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRecordingSelect = (recordId: number) => {
    setSelectedRecordings(prev => {
      const newSelection = prev.includes(recordId) 
        ? prev.filter(id => id !== recordId)
        : [...prev, recordId];
      
      // 총 시간 계산
      const selectedRecords = myRecordings.filter(r => newSelection.includes(r.id));
      const total = selectedRecords.reduce((sum, record) => sum + record.durationSeconds, 0);
      setTotalDuration(total);
      
      return newSelection;
    });
  };

  const handleYoutubeLinkChange = (index: number, value: string) => {
    const newLinks = [...youtubeLinks];
    newLinks[index] = value;
    setYoutubeLinks(newLinks);
  };

  const addYoutubeLink = () => {
    if (youtubeLinks.length < 3) {
      setYoutubeLinks([...youtubeLinks, '']);
    }
  };

  const removeYoutubeLink = (index: number) => {
    if (youtubeLinks.length > 1) {
      const newLinks = youtubeLinks.filter((_, i) => i !== index);
      setYoutubeLinks(newLinks);
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (selectedRecordings.length === 0) {
      errors.push('최소 1개의 녹음본을 선택해주세요.');
    }

    const validLinks = youtubeLinks.filter(link => link.trim() && aiDemoService.isValidYouTubeLink(link));
    if (validLinks.length === 0) {
      errors.push('최소 1개의 유효한 YouTube 링크를 입력해주세요.');
    }

    if (totalDuration < 1800) { // 30분 = 1800초
      errors.push('선택한 녹음본의 총 시간이 30분 이상이어야 합니다.');
    }

    return errors;
  };

  const handleSubmitApplication = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setLoading(true);
    try {
      const validLinks = youtubeLinks.filter(link => link.trim() && aiDemoService.isValidYouTubeLink(link));
      await aiDemoService.createApplication({
        recordIds: selectedRecordings,
        youtubeLinks: validLinks
      });

      alert('AI 데모 신청이 완료되었습니다!');
      setSelectedRecordings([]);
      setYoutubeLinks(['']);
      setTotalDuration(0);
      loadData(); // 데이터 새로고침
    } catch (error) {
      console.error('신청 오류:', error);
      alert('신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${secs}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${secs}초`;
    } else {
      return `${secs}초`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Pending sx={{ color: '#ffa500' }} />;
      case 'APPROVED': return <CheckCircle sx={{ color: '#00ff00' }} />;
      case 'REJECTED': return <Cancel sx={{ color: '#ff0000' }} />;
      case 'COMPLETED': return <CheckCircle sx={{ color: '#00ffff' }} />;
      default: return <Pending sx={{ color: '#ffa500' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#ffa500';
      case 'APPROVED': return '#00ff00';
      case 'REJECTED': return '#ff0000';
      case 'COMPLETED': return '#00ffff';
      default: return '#ffa500';
    }
  };

  // 오디오 재생/일시정지
  const togglePlayback = useCallback((url: string) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    if (playingAudio === url && isPlaying) {
      // 현재 재생 중인 오디오를 일시정지
      audio.pause();
      setIsPlaying(false);
    } else {
      // 새로운 오디오 재생 또는 재생 재개
      if (playingAudio !== url) {
        audio.src = url;
        setPlayingAudio(url);
      }
      audio.play();
      setIsPlaying(true);
    }
  }, [playingAudio, isPlaying]);

  // 오디오 시간 업데이트
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration) {
        setDuration(audioRef.current.duration);
      }
    }
  }, [duration]);

  // 오디오 재생 완료
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayingAudio(null);
  }, []);

  // 시간 포맷팅
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: `
          radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
          linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)
        `,
      color: '#fff',
      paddingTop: '80px',
    }}>
      <style dangerouslySetInnerHTML={{ __html: cyberpunkStyles }} />
      <div style={{
        opacity: isInitialized ? 1 : 0,
        transform: isInitialized ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s ease'
      }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #00ffff, #ff0080)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 10px 0',
              textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'
            }}>
              AI VOICE DEMO
            </h1>
            <p style={{
              color: '#00ffff',
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              나만의 AI 음성 데모를 만들어보세요
            </p>
          </div>

          <Paper 
            elevation={0}
            sx={{ 
              background: 'rgba(26, 26, 26, 0.8)',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              borderRadius: '15px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#00ffff',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#00ffff',
                },
              }}
            >
              <Tab label="새 신청" />
              <Tab label="내 신청 목록" />
              <Tab label="AI 데모 파일" />
            </Tabs>

            {/* 새 신청 탭 */}
            <TabPanel value={tabValue} index={0}>
              <Typography 
                variant="body1" 
                sx={{ fontSize: '1.1rem', mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}
              >
                내 녹음본과 YouTube 링크를 선택하여 AI 음성 데모를 신청하세요.
              </Typography>

              {/* 녹음본 선택 */}
              <Card sx={{ mb: 4, p: 2, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '10px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#00ffff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MusicNote />
                    녹음본 선택
                  </Typography>
                  
                  {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress sx={{ color: '#00ffff' }} />
                    </Box>
                  ) : (
                    <>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
                          총 선택 시간: {formatDuration(totalDuration)} / 최소 30분 필요
                        </Typography>
                        {totalDuration < 1800 && (
                          <Alert severity="warning" sx={{ mb: 2, background: 'rgba(255, 165, 0, 0.1)', color: '#ffa500' }}>
                            최소 30분 이상의 녹음본을 선택해주세요.
                          </Alert>
                        )}
                      </Box>

                      <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {myRecordings.map((recording) => (
                          <FormControlLabel
                            key={recording.id}
                            control={
                              <Checkbox
                                checked={selectedRecordings.includes(recording.id)}
                                onChange={() => handleRecordingSelect(recording.id)}
                                sx={{
                                  color: '#00ffff',
                                  '&.Mui-checked': {
                                    color: '#00ffff',
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                  {recording.title}
                                </Typography>
                                <Chip 
                                  label={formatDuration(recording.durationSeconds)} 
                                  size="small" 
                                  sx={{ 
                                    background: 'rgba(0, 255, 255, 0.2)', 
                                    color: '#00ffff',
                                    ml: 1
                                  }} 
                                />
                              </Box>
                            }
                            sx={{ display: 'flex', width: '100%', mb: 1 }}
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* YouTube 링크 입력 */}
              <Card sx={{ mb: 4, p: 2, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '10px' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#00ffff', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <YouTube />
                    YouTube 링크 입력 (최대 3개)
                  </Typography>
                  
                  {youtubeLinks.map((link, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        value={link}
                        onChange={(e) => handleYoutubeLinkChange(index, e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            color: '#fff',
                            '& fieldset': {
                              borderColor: 'rgba(0, 255, 255, 0.3)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(0, 255, 255, 0.5)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#00ffff',
                            },
                          },
                        }}
                      />
                      {youtubeLinks.length > 1 && (
                        <IconButton 
                          onClick={() => removeYoutubeLink(index)}
                          sx={{ color: '#ff0000' }}
                        >
                          <Remove />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                  
                  {youtubeLinks.length < 3 && (
                    <Button 
                      startIcon={<Add />} 
                      onClick={addYoutubeLink}
                      sx={{ 
                        color: '#00ffff', 
                        borderColor: '#00ffff',
                        '&:hover': {
                          borderColor: '#00ffff',
                          background: 'rgba(0, 255, 255, 0.1)',
                        }
                      }}
                      variant="outlined"
                    >
                      링크 추가
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* 신청 버튼 */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleSubmitApplication}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(45deg, #00ffff, #ff0080)',
                    color: '#000',
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.3)',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: '#000' }} /> : 'AI 데모 신청하기'}
                </Button>
              </Box>
            </TabPanel>

            {/* 내 신청 목록 탭 */}
            <TabPanel value={tabValue} index={1}>
              <Typography 
                variant="body1" 
                sx={{ fontSize: '1.1rem', mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}
              >
                내가 신청한 AI 데모의 상태를 확인하세요.
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress sx={{ color: '#00ffff' }} />
                </Box>
              ) : myApplications.length === 0 ? (
                <Alert severity="info" sx={{ background: 'rgba(0, 255, 255, 0.1)', color: '#00ffff' }}>
                  아직 신청한 AI 데모가 없습니다.
                </Alert>
              ) : (
                myApplications.map((application) => (
                  <Card key={application.id} sx={{ mb: 3, p: 2, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '10px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#00ffff', fontWeight: 'bold' }}>
                          신청 #{application.id}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(application.status)}
                          <Chip
                            label={application.statusDescription}
                            sx={{
                              background: getStatusColor(application.status),
                              color: '#000',
                              fontWeight: 'bold',
                              animation: 'statusPulse 2s infinite',
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          선택된 녹음본: {application.records.length}개
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          YouTube 링크: {application.youtubeLinks.length}개
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          신청일: {new Date(application.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      {application.adminNote && (
                        <Alert severity="info" sx={{ background: 'rgba(0, 255, 255, 0.1)', color: '#00ffff', mt: 2 }}>
                          관리자 메모: {application.adminNote}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabPanel>

            {/* AI 데모 파일 탭 */}
            <TabPanel value={tabValue} index={2}>
              <Typography 
                variant="body1" 
                sx={{ fontSize: '1.1rem', mb: 4, color: 'rgba(255, 255, 255, 0.8)' }}
              >
                완성된 AI 데모 파일을 재생하세요.
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress sx={{ color: '#00ffff' }} />
                </Box>
              ) : myDemoRecords.length === 0 ? (
                <Alert severity="info" sx={{ background: 'rgba(0, 255, 255, 0.1)', color: '#00ffff' }}>
                  아직 완성된 AI 데모 파일이 없습니다.
                </Alert>
              ) : (
                myDemoRecords.map((record) => (
                  <Card key={record.id} sx={{ mb: 3, p: 2, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '10px' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#00ffff', fontWeight: 'bold' }}>
                          {record.title}
                        </Typography>
                        <Chip
                          label={formatDuration(record.durationSeconds)}
                          sx={{
                            background: 'rgba(0, 255, 255, 0.2)',
                            color: '#00ffff',
                            fontWeight: 'bold',
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                            파일 크기: {Math.round(parseInt(record.file_size) / 1024 / 1024)}MB
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            생성일: {new Date(record.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        
                        <Tooltip title={playingAudio === record.url && isPlaying ? "일시정지" : "재생"}>
                          <IconButton
                            onClick={() => togglePlayback(record.url)}
                            sx={{
                              width: 48,
                              height: 48,
                              background: playingAudio === record.url && isPlaying 
                                ? 'rgba(255,0,128,0.2)' 
                                : 'rgba(0,255,255,0.2)',
                              color: playingAudio === record.url && isPlaying 
                                ? '#ff0080' 
                                : '#00ffff',
                              border: `2px solid ${playingAudio === record.url && isPlaying 
                                ? '#ff0080' 
                                : '#00ffff'}`,
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: `0 0 20px ${playingAudio === record.url && isPlaying 
                                  ? 'rgba(255,0,128,0.5)' 
                                  : 'rgba(0,255,255,0.5)'}`,
                              }
                            }}
                          >
                            {playingAudio === record.url && isPlaying ? <Pause /> : <PlayArrow />}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* 오디오 플레이어 */}
                      <audio
                        ref={audioRef}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleEnded}
                        onLoadedMetadata={() => {
                          if (audioRef.current) {
                            setDuration(audioRef.current.duration);
                          }
                        }}
                        preload="metadata"
                      />

                      {playingAudio === record.url && (
                        <Box sx={{ mt: 2, p: 2, background: 'rgba(0, 255, 255, 0.1)', borderRadius: '8px' }}>
                          <Typography variant="body2" sx={{ 
                            color: '#00ffff', 
                            fontFamily: 'monospace',
                            mb: 1 
                          }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </Typography>
                          
                          {/* 진행바 */}
                          <Box
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: 'rgba(255,255,255,0.1)',
                              overflow: 'hidden',
                            }}
                          >
                            <Box
                              sx={{
                                height: '100%',
                                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                background: 'linear-gradient(90deg, #00ffff, #ff0080)',
                                boxShadow: '0 0 10px rgba(0,255,255,0.6)',
                                transition: 'width 0.1s ease',
                              }}
                            />
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabPanel>
          </Paper>
        </Container>
      </div>
    </div>
  );
};

export default AIDemoPage;