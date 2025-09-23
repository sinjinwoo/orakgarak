/**
 * 컴포넌트 통합 Export
 * 모든 컴포넌트들을 카테고리별로 정리하여 export합니다.
 */

// === UI 컴포넌트들 ===
export * from './ui';

// === Album 관련 ===
export * from './album';

// === Profile 관련 ===
export * from './profile';

// === Feed 관련 ===
export * from './feed';

// === Common 컴포넌트들 ===
export { default as Header } from './common/Header';
export { default as SimpleHeader } from './common/SimpleHeader';
export { default as Footer } from './common/Footer';
export { default as Toast } from './common/Toast';
export { default as LoadingSpinner } from './common/LoadingSpinner';
export { default as CyberpunkEffects } from './common/CyberpunkEffects';

// === Auth 관련 ===
export { default as AuthGuard } from './auth/AuthGuard';

// === Onboarding 관련 ===
export { default as AnalysisSummary } from './onboarding/AnalysisSummary';
export { default as OneLineRecorder } from './onboarding/OneLineRecorder';
export { default as SongSearchField } from './onboarding/SongSearchField';
export { default as SurveyForm } from './onboarding/SurveyForm';
export { default as VoiceRangeGame } from './onboarding/VoiceRangeGame';

// === Record 관련 ===
export { default as AudioFileUpload } from './record/AudioFileUpload';
export { default as CyberpunkSpeaker3D } from './record/CyberpunkSpeaker3D';
export { default as KaraokePlayer } from './record/KaraokePlayer';
export { default as LyricsPanel } from './record/LyricsPanel';
export { default as MRLyricsCard } from './record/MRLyricsCard';
export { default as PitchGraph } from './record/PitchGraph';
export { default as RecordingControls } from './record/RecordingControls';
export { default as ReservationQueue } from './record/ReservationQueue';
export { default as SongSearchPanel } from './record/SongSearchPanel';
export { default as VolumeVisualizer } from './record/VolumeVisualizer';
export { default as YouTubeMRPlayer } from './record/YouTubeMRPlayer';

// === Recommendation 관련 ===
export { default as CoverFlow } from './recommendation/CoverFlow';
export { default as SongCard } from './recommendation/SongCard';

// === Voice Test 관련 ===
export { default as AirplaneRecordingTest } from './voiceTest/AirplaneRecordingTest';
export { default as ExistingRecordingSelection } from './voiceTest/ExistingRecordingSelection';
export { default as GameExitModal } from './voiceTest/GameExitModal';
export { default as GamePauseModal } from './voiceTest/GamePauseModal';
export { default as GameResultModal } from './voiceTest/GameResultModal';
export { default as GameStartModal } from './voiceTest/GameStartModal';
export { default as VoiceTestGame } from './voiceTest/VoiceTestGame';
export { default as VoiceTestSelection } from './voiceTest/VoiceTestSelection';

// === 기타 컴포넌트들 ===
export { default as AlbumCoverflow } from './AlbumCoverflow';
export { default as AnimatedBackground } from './AnimatedBackground';
export { default as EqualizerBars } from './EqualizerBars';
export { default as FloatingMusicElements } from './FloatingMusicElements';
export { default as GlassmorphismCard } from './GlassmorphismCard';
export { default as LPRecord } from './LPRecord';
export { default as ServiceExplainer } from './ServiceExplainer';
export { default as SimpleBackground } from './SimpleBackground';
