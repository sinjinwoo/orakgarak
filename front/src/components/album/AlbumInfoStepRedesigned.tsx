/**
 * 리디자인된 앨범 정보 페이지
 * 3단 레이아웃: 좌측 스테퍼, 중앙 2열(스토리 폼 + 커버 캔버스), 우측 실시간 미리보기
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Star,
  CheckCircle,
  Upload,
  Palette,
  Image as ImageIcon,
  Download,
  RotateCcw,
  MousePointer,
  Lightbulb,
  Hash,
  Type,
  FileText,
  Layers,
  Sparkles,
  Settings,
  Sliders,
  Eye,
  EyeOff,
  Plus,
  X,
  Shuffle,
  Copy,
  Zap,
  Music,
  Heart,
  Clock3,
  Volume2
} from 'lucide-react';
import { useAlbumMetaStore } from '../../stores/albumMetaStore';

// 스텝 정보 인터페이스
interface StepInfo {
  id: 'recordings' | 'cover' | 'metadata' | 'preview';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  status: 'pending' | 'current' | 'completed';
  estimatedTime: string;
  required: boolean;
  progress?: number;
}

// 더미 데이터
const dummyTrackInsights = {
  mood: 'nostalgic',
  key: 'C major',
  bpm: 92,
  lyricTone: 'melancholic',
  enabled: {
    mood: true,
    key: true,
    bpm: false,
    lyricTone: true,
  }
};

const dummyAutoChips = [
  { id: '1', text: 'Pastel', category: 'mood' as const, weight: 0.8 },
  { id: '2', text: '밝음', category: 'mood' as const, weight: 0.7 },
  { id: '3', text: '90BPM', category: 'tempo' as const, weight: 0.6 },
  { id: '4', text: 'Indie Pop', category: 'genre' as const, weight: 0.9 },
];

const stylePresets = [
  { id: 'poster', name: '포스터', preview: '🎭' },
  { id: 'filmgrain', name: '필름그레인', preview: '📸' },
  { id: 'lineart', name: '라인아트', preview: '✏️' },
  { id: 'collage', name: '콜라주', preview: '🎨' },
];

const fontPresets = [
  { id: 'modern', name: 'Modern', preview: 'Aa' },
  { id: 'classic', name: 'Classic', preview: 'Aa' },
  { id: 'handwrite', name: 'Hand', preview: 'Aa' },
];

interface Props {
  onNext: () => void;
  onPrev: () => void;
  onSaveDraft: () => void;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    duration: number;
  }>;
}

const AlbumInfoStepRedesigned: React.FC<Props> = ({
  onNext,
  onPrev,
  onSaveDraft,
  tracks = []
}) => {
  // Store state
  const {
    coreKeywords,
    tagline,
    description,
    autoChips,
    brandLock,
    cover,
    insights,
    isPublic,
    comparisonMode,
    setCoreKeywords,
    setTagline,
    setDescription,
    addAutoChip,
    removeAutoChip,
    insertChipToField,
    setBrandLock,
    updateBrandFont,
    updateBrandPalette,
    uploadBrandLogo,
    setCoverMode,
    updateCoverParams,
    addCoverVariant,
    selectCoverVariant,
    addToReferenceBoard,
    setInsights,
    toggleInsightEnabled,
    setIsPublic,
    setComparisonMode,
    generatePrompt,
    saveToStorage
  } = useAlbumMetaStore();

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuickGuide, setShowQuickGuide] = useState(false);
  const [draggedChip, setDraggedChip] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 스텝 정보
  const steps: StepInfo[] = [
    {
      id: 'recordings',
      title: '트랙 선택',
      subtitle: '앨범에 포함할 녹음 선택',
      icon: <Music className="w-4 h-4" />,
      status: 'completed',
      estimatedTime: '2분',
      required: true,
      progress: 100
    },
    {
      id: 'cover',
      title: '커버 디자인',
      subtitle: 'AI 생성 또는 직접 업로드',
      icon: <ImageIcon className="w-4 h-4" />,
      status: 'current',
      estimatedTime: '3-5분',
      required: false,
      progress: 45
    },
    {
      id: 'metadata',
      title: '앨범 정보',
      subtitle: '스토리와 메타데이터',
      icon: <FileText className="w-4 h-4" />,
      status: 'pending',
      estimatedTime: '3분',
      required: true
    },
    {
      id: 'preview',
      title: '최종 미리보기',
      subtitle: '발행 전 최종 검토',
      icon: <Eye className="w-4 h-4" />,
      status: 'pending',
      estimatedTime: '1분',
      required: true
    }
  ];

  // 초기화
  React.useEffect(() => {
    // 더미 데이터로 초기화
    dummyAutoChips.forEach(chip => addAutoChip(chip));
    setInsights(dummyTrackInsights);
  }, []);

  // 칩 드래그 핸들러
  const handleChipDragStart = (chipId: string) => {
    setDraggedChip(chipId);
  };

  const handleFieldDrop = useCallback((field: 'tagline' | 'description', event: React.DragEvent) => {
    event.preventDefault();
    if (!draggedChip) return;

    const textArea = event.currentTarget as HTMLTextAreaElement;
    const position = textArea.selectionStart || textArea.value.length;
    insertChipToField(draggedChip, field, position);
    setDraggedChip(null);
  }, [draggedChip, insertChipToField]);

  // AI 커버 생성
  const handleGenerateCovers = async () => {
    setIsGenerating(true);
    try {
      const promptData = generatePrompt();
      console.log('Generated prompt:', promptData);

      // 더미 변형 생성
      await new Promise(resolve => setTimeout(resolve, 2000));

      for (let i = 1; i <= 4; i++) {
        addCoverVariant({
          id: `variant-${Date.now()}-${i}`,
          imageUrl: `https://picsum.photos/400/400?random=${Date.now() + i}`,
          seed: Math.floor(Math.random() * 1000)
        });
      }
    } catch (error) {
      console.error('Failed to generate covers:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // 파일 업로드
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverMode('upload');
      // setCoverUpload(url); // 이 메서드가 스토어에 없음
    }
  };

  // 총 재생시간 계산
  const totalDuration = useMemo(() => {
    return tracks.reduce((sum, track) => sum + track.duration, 0);
  }, [tracks]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-indigo-50/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.05)_0%,transparent_50%)] pointer-events-none" />

      {/* Left Column - Enhanced Stepper */}
      <div className="w-72 bg-white/70 backdrop-blur-lg border-r border-gray-200/50 flex flex-col relative">
        <div className="p-6 border-b border-gray-200/50">
          <h1 className="text-xl font-bold text-gray-900 mb-2">앨범 제작</h1>
          <p className="text-sm text-gray-600">나만의 앨범을 만들어보세요</p>

          {/* 빠른 시작 가이드 토글 */}
          <button
            onClick={() => setShowQuickGuide(!showQuickGuide)}
            className="mt-3 flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700"
          >
            <Lightbulb className="w-3 h-3" />
            3단 빠른 시작 가이드
          </button>
        </div>

        {/* 빠른 시작 가이드 */}
        <AnimatePresence>
          {showQuickGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-gray-200/50"
            >
              <div className="p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-green-700">1</span>
                  </div>
                  키워드 입력
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-blue-700">2</span>
                  </div>
                  프리셋 선택
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-4 h-4 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-purple-700">3</span>
                  </div>
                  발행 미리보기
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 스텝 리스트 */}
        <div className="flex-1 p-4 space-y-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`relative p-4 rounded-xl transition-all duration-200 cursor-pointer group ${
                step.status === 'current'
                  ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                  : step.status === 'completed'
                  ? 'bg-green-50/50 border border-green-200/50'
                  : 'bg-white/50 border border-gray-200/30 hover:bg-white/80'
              }`}
            >
              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-6 top-12 w-0.5 h-8 bg-gradient-to-b from-gray-300 to-gray-100" />
              )}

              <div className="flex items-start gap-3">
                {/* Icon with status */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  step.status === 'current'
                    ? 'bg-indigo-100 text-indigo-600'
                    : step.status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium text-sm ${
                      step.status === 'current' ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {step.title}
                    </h3>

                    {/* Badges */}
                    <div className="flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                        step.required
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {step.required ? '필수' : '선택'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-2">{step.subtitle}</p>

                  {/* Time estimate with icon */}
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{step.estimatedTime}</span>
                  </div>

                  {/* Progress bar for current step */}
                  {step.status === 'current' && step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="h-1 bg-indigo-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${step.progress}%` }}
                          className="h-full bg-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 임시저장 버튼 */}
        <div className="p-4 border-t border-gray-200/50">
          <button
            onClick={() => {
              saveToStorage();
              onSaveDraft();
            }}
            className="w-full py-2 px-3 text-sm text-gray-600 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            임시저장
          </button>
        </div>
      </div>

      {/* Center Columns - Story Form + Cover Canvas */}
      <div className="flex-1 flex">
        {/* Center Left - Story Form */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto max-w-lg">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">앨범 스토리</h2>
            <p className="text-sm text-gray-600">앨범의 이야기를 들려주세요</p>
          </div>

          {/* Core Keywords */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Hash className="w-4 h-4 inline mr-1" />
              핵심 키워드
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="엔터로 키워드를 추가하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setCoreKeywords([...coreKeywords, e.currentTarget.value.trim()]);
                    e.currentTarget.value = '';
                  }
                }}
              />
              {coreKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {coreKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md"
                    >
                      #{keyword}
                      <button
                        onClick={() => setCoreKeywords(coreKeywords.filter((_, i) => i !== index))}
                        className="hover:text-indigo-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <Type className="w-4 h-4 inline mr-1" />
              한 줄 소개
            </label>
            <div className="relative">
              <textarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFieldDrop('tagline', e)}
                placeholder="앨범을 한 줄로 표현해주세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={2}
              />
              {/* Auto chips display */}
              <div className="absolute right-2 top-2">
                <button className="text-gray-400 hover:text-indigo-500">
                  <MousePointer className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 inline mr-1" />
              확장 설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleFieldDrop('description', e)}
              placeholder="앨범에 대한 자세한 설명을 입력하세요"
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={4}
            />
          </div>

          {/* Context Chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                <Sparkles className="w-4 h-4 inline mr-1" />
                콘텍스트 칩 (자동)
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {autoChips.map((chip) => (
                <motion.div
                  key={chip.id}
                  draggable
                  onDragStart={() => handleChipDragStart(chip.id)}
                  whileDrag={{ scale: 0.95, rotate: 5 }}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium cursor-move transition-colors ${
                    chip.category === 'mood' ? 'bg-pink-100 text-pink-700' :
                    chip.category === 'genre' ? 'bg-purple-100 text-purple-700' :
                    chip.category === 'tempo' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}
                >
                  {chip.text}
                  <MousePointer className="w-3 h-3 opacity-60" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Brand Lock Section */}
          <div className="space-y-4 p-4 bg-gray-50/50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">
                <Settings className="w-4 h-4 inline mr-1" />
                브랜드 잠금 (선택)
              </h3>
              <button className="text-xs text-indigo-600 hover:text-indigo-700">
                {brandLock ? '해제' : '활성화'}
              </button>
            </div>

            {brandLock && (
              <div className="space-y-3">
                {/* Logo upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadBrandLogo(URL.createObjectURL(file));
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors"
                  >
                    <Upload className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                    <span className="text-xs text-gray-600">로고 업로드</span>
                  </button>
                </div>

                {/* Font presets */}
                <div>
                  <label className="text-xs text-gray-700 mb-2 block">폰트 프리셋</label>
                  <div className="grid grid-cols-3 gap-2">
                    {fontPresets.map((font) => (
                      <button
                        key={font.id}
                        onClick={() => updateBrandFont(font.id as any)}
                        className={`p-2 border rounded-lg text-xs transition-colors ${
                          brandLock?.font === font.id
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-bold mb-1">{font.preview}</div>
                        {font.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color palette */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-700">팔레트</label>
                    <button className="text-xs text-indigo-600">
                      {brandLock?.palette?.locked ? '잠금' : '잠금해제'}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="color"
                        value={brandLock?.palette?.primary || '#A855F7'}
                        onChange={(e) => updateBrandPalette({
                          ...brandLock?.palette,
                          primary: e.target.value,
                          locked: brandLock?.palette?.locked || false
                        })}
                        className="w-full h-8 rounded border border-gray-300"
                      />
                      <span className="text-xs text-gray-600">주색상</span>
                    </div>
                    <div className="flex-1">
                      <input
                        type="color"
                        value={brandLock?.palette?.secondary || '#EC4899'}
                        onChange={(e) => updateBrandPalette({
                          ...brandLock?.palette,
                          secondary: e.target.value,
                          locked: brandLock?.palette?.locked || false,
                          primary: brandLock?.palette?.primary || '#A855F7'
                        })}
                        className="w-full h-8 rounded border border-gray-300"
                      />
                      <span className="text-xs text-gray-600">보조색상</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Track Insights */}
          {insights && (
            <div className="space-y-3 p-4 bg-blue-50/30 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-gray-900">
                <Zap className="w-4 h-4 inline mr-1" />
                트랙 기반 자동 인사이트
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={insights.enabled.mood}
                    onChange={() => toggleInsightEnabled('mood')}
                    className="rounded"
                  />
                  <span className="text-gray-700">
                    <Heart className="w-3 h-3 inline mr-1 text-pink-500" />
                    {insights.mood}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={insights.enabled.key}
                    onChange={() => toggleInsightEnabled('key')}
                    className="rounded"
                  />
                  <span className="text-gray-700">
                    <Music className="w-3 h-3 inline mr-1 text-blue-500" />
                    {insights.key}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={insights.enabled.bpm}
                    onChange={() => toggleInsightEnabled('bpm')}
                    className="rounded"
                  />
                  <span className="text-gray-700">
                    <Clock3 className="w-3 h-3 inline mr-1 text-green-500" />
                    {insights.bpm} BPM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={insights.enabled.lyricTone}
                    onChange={() => toggleInsightEnabled('lyricTone')}
                    className="rounded"
                  />
                  <span className="text-gray-700">
                    <Volume2 className="w-3 h-3 inline mr-1 text-purple-500" />
                    {insights.lyricTone}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Right - Cover Canvas */}
        <div className="flex-1 p-6 space-y-6 bg-white/30 backdrop-blur-sm border-l border-gray-200/50 max-w-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">커버 디자인</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`p-2 rounded-lg transition-colors ${
                  comparisonMode ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCoverMode('ai')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                cover.mode === 'ai'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              AI 커버
            </button>
            <button
              onClick={() => setCoverMode('upload')}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                cover.mode === 'upload'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4 inline mr-1" />
              직접 업로드
            </button>
          </div>

          {/* AI Cover Tab */}
          {cover.mode === 'ai' && (
            <div className="space-y-4">
              {/* Style Presets */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">스타일 프리셋</label>
                <div className="grid grid-cols-2 gap-2">
                  {stylePresets.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => updateCoverParams({ style: style.id as any })}
                      className={`p-3 border rounded-lg transition-colors text-center ${
                        cover.params.style === style.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-lg mb-1">{style.preview}</div>
                      <div className="text-xs text-gray-700">{style.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Board */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">레퍼런스 보드</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">이미지나 URL을 드롭하세요</p>
                </div>
              </div>

              {/* Parameters */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <Sliders className="w-4 h-4 inline mr-1" />
                  컴포저 파라미터
                </label>

                {/* Emphasize Color */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">강조 색상</span>
                  </div>
                  <input
                    type="color"
                    value={cover.params.emphasizeColor}
                    onChange={(e) => updateCoverParams({ emphasizeColor: e.target.value })}
                    className="w-full h-8 rounded border border-gray-300"
                  />
                </div>

                {/* Noise */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">노이즈</span>
                    <span className="text-xs text-gray-500">{Math.round(cover.params.noise * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={cover.params.noise}
                    onChange={(e) => updateCoverParams({ noise: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Texture */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">텍스처</span>
                    <span className="text-xs text-gray-500">{Math.round(cover.params.texture * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={cover.params.texture}
                    onChange={(e) => updateCoverParams({ texture: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Focus Subject */}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">포커스 피사체</label>
                  <input
                    type="text"
                    value={cover.params.focusSubject}
                    onChange={(e) => updateCoverParams({ focusSubject: e.target.value })}
                    placeholder="예: 꽃, 도시 풍경, 사람"
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerateCovers}
                disabled={isGenerating}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    생성 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    4개 변형 생성
                  </div>
                )}
              </button>

              {/* Generated Variants */}
              {cover.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시드/버전 ({cover.variants.length}개)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {cover.variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => selectCoverVariant(variant.id)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                          cover.variantId === variant.id
                            ? 'border-indigo-500'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={variant.imageUrl}
                          alt={`Variant ${variant.id}`}
                          className="w-full h-full object-cover"
                        />
                        {cover.variantId === variant.id && (
                          <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload Tab */}
          {cover.mode === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">드래그앤드롭 또는 클릭</p>
                  <p className="text-xs text-gray-500">JPG, PNG 권장</p>
                </label>
              </div>

              {/* Crop Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비율 조정</label>
                <div className="flex gap-2">
                  {['1:1', '4:5', '16:9'].map((ratio) => (
                    <button
                      key={ratio}
                      className="flex-1 py-2 px-3 text-xs border border-gray-300 rounded hover:border-gray-400 transition-colors"
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Real-time Album Card */}
      <div className="w-80 bg-white/50 backdrop-blur-sm border-l border-gray-200/50 p-6 overflow-y-auto">
        <div className="sticky top-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">실시간 미리보기</h2>

          {/* Album Card Preview */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Cover Image */}
            <div className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 relative">
              {cover.variantId && cover.variants.length > 0 ? (
                <img
                  src={cover.variants.find(v => v.id === cover.variantId)?.imageUrl}
                  alt="Album Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-gray-300" />
                </div>
              )}

              {/* Brand Lock Overlay */}
              {brandLock && brandLock.logo && (
                <div className="absolute top-2 right-2">
                  <img
                    src={brandLock.logo}
                    alt="Brand Logo"
                    className="w-8 h-8 rounded"
                  />
                </div>
              )}
            </div>

            {/* Album Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 truncate">
                  {tagline || '새 앨범'}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {description || '앨범 설명을 입력하세요...'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{tracks.length}곡</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>

              {/* Mood Dots */}
              {insights && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">무드:</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>제작 진행률</span>
                  <span>65%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                </div>
              </div>

              {/* Core Keywords Display */}
              {coreKeywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {coreKeywords.slice(0, 3).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      #{keyword}
                    </span>
                  ))}
                  {coreKeywords.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{coreKeywords.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Track List Preview */}
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-medium text-gray-700">수록곡</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2 bg-white/70 rounded text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-gray-400">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{track.title}</p>
                      <p className="text-gray-500 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-gray-400 ml-2">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar - Fixed Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            이전 단계
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              변경사항 자동 저장됨
            </span>
            <button
              onClick={onNext}
              disabled={!tagline.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              다음 단계
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumInfoStepRedesigned;