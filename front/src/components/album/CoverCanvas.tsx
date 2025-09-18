/**
 * 커버 캔버스 컴포넌트
 * AI 커버 생성 및 직접 업로드 기능과 A/B 비교 모드 지원
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Upload,
  Palette,
  Sliders,
  RotateCcw,
  History,
  ArrowLeftRight,
  Download,
  Settings,
  Image as ImageIcon,
  Link,
  Plus,
  X,
  Grid3x3,
  Square,
  Crop,
} from 'lucide-react';
import { useAlbumMetaStore } from '../../stores/albumMetaStore';

interface CoverCanvasProps {
  className?: string;
}

// 스타일 프리셋 탭
const StylePresets: React.FC = () => {
  const { cover, updateCoverParams } = useAlbumMetaStore();

  const presets = [
    { id: 'poster', name: '포스터', icon: '🎨', description: '클래식한 앨범 포스터' },
    { id: 'filmgrain', name: '필름그레인', icon: '📸', description: '빈티지 필름 질감' },
    { id: 'lineart', name: '라인아트', icon: '✏️', description: '미니멀 라인 드로잉' },
    { id: 'collage', name: '콜라주', icon: '🎭', description: '다채로운 콜라주' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/90">스타일 프리셋</h4>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => updateCoverParams({ style: preset.id as any })}
            className={`
              p-3 rounded-lg text-left transition-all border
              ${cover.params.style === preset.id
                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
              }
            `}
          >
            <div className="text-lg mb-1">{preset.icon}</div>
            <div className="text-sm font-medium">{preset.name}</div>
            <div className="text-xs opacity-60">{preset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// 레퍼런스 보드
const ReferenceBoard: React.FC = () => {
  const { cover, addToReferenceBoard, removeFromReferenceBoard } = useAlbumMetaStore();
  const [newUrl, setNewUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);

      // 간단한 팔레트 추출 (실제로는 라이브러리 사용)
      const palette = ['#A855F7', '#EC4899', '#3B82F6', '#10B981'];

      addToReferenceBoard({
        id: Date.now().toString(),
        url,
        type: 'image',
        palette,
      });
    }
  }, [addToReferenceBoard]);

  const handleUrlAdd = useCallback(() => {
    if (newUrl.trim()) {
      // 간단한 팔레트 (실제로는 이미지에서 추출)
      const palette = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B'];

      addToReferenceBoard({
        id: Date.now().toString(),
        url: newUrl,
        type: 'url',
        palette,
      });
      setNewUrl('');
    }
  }, [newUrl, addToReferenceBoard]);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-white/90">레퍼런스 보드</h4>

      {/* 추가 버튼들 */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
        >
          <ImageIcon size={14} />
          이미지
        </button>
        <button
          onClick={handleUrlAdd}
          disabled={!newUrl.trim()}
          className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <Link size={14} />
          URL 추가
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <input
        type="text"
        value={newUrl}
        onChange={(e) => setNewUrl(e.target.value)}
        placeholder="이미지 URL을 입력하세요"
        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
      />

      {/* 레퍼런스 이미지들 */}
      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
        {cover.referenceBoard.map((ref) => (
          <div key={ref.id} className="relative group">
            <img
              src={ref.url}
              alt="Reference"
              className="w-full h-16 object-cover rounded-lg"
            />
            <button
              onClick={() => removeFromReferenceBoard(ref.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={10} className="text-white" />
            </button>
            {/* 팔레트 */}
            <div className="flex gap-1 mt-1">
              {ref.palette.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full border border-white/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 컴포저 파라미터
const ComposerParameters: React.FC = () => {
  const { cover, updateCoverParams } = useAlbumMetaStore();
  const { params } = cover;

  const handleSliderChange = useCallback((key: string, value: number) => {
    updateCoverParams({ [key]: value });
  }, [updateCoverParams]);

  const handleKeyboardAdjust = useCallback((e: React.KeyboardEvent, key: string, currentValue: number) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      handleSliderChange(key, Math.min(1, currentValue + 0.01));
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      handleSliderChange(key, Math.max(0, currentValue - 0.01));
    }
  }, [handleSliderChange]);

  const sliders = [
    { key: 'noise', label: '노이즈', min: 0, max: 1, step: 0.01, value: params.noise },
    { key: 'texture', label: '텍스처', min: 0, max: 1, step: 0.01, value: params.texture },
    { key: 'marginRatio', label: '여백 비율', min: 0, max: 0.5, step: 0.01, value: params.marginRatio },
    { key: 'typoRatio', label: '타이포 비율', min: 0, max: 1, step: 0.01, value: params.typoRatio },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-white/90">컴포저 파라미터</h4>

      {/* 강조 색상 */}
      <div>
        <label className="block text-xs text-white/70 mb-2">강조 색상</label>
        <input
          type="color"
          value={params.emphasizeColor}
          onChange={(e) => updateCoverParams({ emphasizeColor: e.target.value })}
          className="w-full h-10 rounded-lg border border-white/20 cursor-pointer"
        />
      </div>

      {/* 포커스 피사체 */}
      <div>
        <label className="block text-xs text-white/70 mb-2">포커스 피사체</label>
        <input
          type="text"
          value={params.focusSubject}
          onChange={(e) => updateCoverParams({ focusSubject: e.target.value })}
          placeholder="예: 마이크, 기타, 꽃 등"
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
        />
      </div>

      {/* 슬라이더들 */}
      {sliders.map((slider) => (
        <div key={slider.key}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-white/70">{slider.label}</label>
            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
              {Math.round(slider.value * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            value={slider.value}
            onChange={(e) => handleSliderChange(slider.key, parseFloat(e.target.value))}
            onKeyDown={(e) => handleKeyboardAdjust(e, slider.key, slider.value)}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #A855F7 0%, #A855F7 ${slider.value * 100}%, rgba(255,255,255,0.1) ${slider.value * 100}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// AI 커버 탭
const AICoverTab: React.FC = () => {
  const { cover, addCoverVariant, selectCoverVariant } = useAlbumMetaStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);

    // 실제로는 API 호출
    setTimeout(() => {
      for (let i = 0; i < 4; i++) {
        addCoverVariant({
          id: `variant_${Date.now()}_${i}`,
          imageUrl: `https://images.unsplash.com/photo-${1493225457124 + i}?w=300&h=300&fit=crop`,
          seed: Math.floor(Math.random() * 10000),
        });
      }
      setIsGenerating(false);
    }, 2000);
  }, [addCoverVariant]);

  return (
    <div className="space-y-6">
      {/* 컨트롤들 */}
      <StylePresets />
      <ReferenceBoard />
      <ComposerParameters />

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-lg transition-all"
      >
        {isGenerating ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            생성 중...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            4개 변형 생성
          </>
        )}
      </button>

      {/* 생성된 변형들 */}
      {cover.variants.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/90">생성된 변형</h4>
          <div className="grid grid-cols-2 gap-2">
            {cover.variants.map((variant) => (
              <motion.button
                key={variant.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => selectCoverVariant(variant.id)}
                className={`
                  relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${cover.variantId === variant.id
                    ? 'border-purple-500 shadow-lg shadow-purple-500/25'
                    : 'border-white/20 hover:border-white/40'
                  }
                `}
              >
                <img
                  src={variant.imageUrl}
                  alt={`Variant ${variant.seed}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1 rounded">
                  #{variant.seed}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 히스토리 */}
      {cover.history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-white/60" />
            <span className="text-sm font-medium text-white/90">최근 히스토리</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {cover.history.slice(0, 8).map((item) => (
              <img
                key={item.id}
                src={item.imageUrl}
                alt="History"
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0 border border-white/20 hover:border-white/40 cursor-pointer transition-all"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 직접 업로드 탭
const UploadTab: React.FC = () => {
  const { cover, setCoverUpload } = useAlbumMetaStore();
  const [uploadedImage, setUploadedImage] = useState<string | null>(cover.uploadedUrl || null);
  const [cropMode, setCropMode] = useState<'1:1' | '4:5' | '16:9'>('1:1');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImage(url);
      setCoverUpload(url);
    }
  }, [setCoverUpload]);

  const aspectRatios = [
    { id: '1:1', label: '정사각형', icon: <Square size={16} /> },
    { id: '4:5', label: '세로형', icon: <Grid3x3 size={16} /> },
    { id: '16:9', label: '가로형', icon: <Crop size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* 업로드 영역 */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-lg p-8 text-center cursor-pointer transition-all"
      >
        {uploadedImage ? (
          <div className="space-y-3">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-32 h-32 object-cover rounded-lg mx-auto"
            />
            <p className="text-white/70">다른 이미지로 변경하려면 클릭</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload size={48} className="mx-auto text-white/40" />
            <div>
              <p className="text-white font-medium">이미지를 업로드하세요</p>
              <p className="text-white/60 text-sm">JPG, PNG, WEBP 지원 (최대 10MB)</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* 크롭 비율 선택 */}
      {uploadedImage && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/90">크롭 비율</h4>
          <div className="flex gap-2">
            {aspectRatios.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setCropMode(ratio.id as any)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${cropMode === ratio.id
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }
                `}
              >
                {ratio.icon}
                {ratio.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 오버레이 타이포 설정 */}
      {uploadedImage && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/90">텍스트 오버레이</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="앨범 제목"
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
            />
            <input
              type="text"
              placeholder="아티스트명"
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CoverCanvas: React.FC<CoverCanvasProps> = ({ className = '' }) => {
  const { cover, setCoverMode, comparisonMode, setComparisonMode } = useAlbumMetaStore();
  const [activeTab, setActiveTab] = useState<'ai' | 'upload'>(cover.mode);

  useEffect(() => {
    setCoverMode(activeTab);
  }, [activeTab, setCoverMode]);

  const tabs = [
    { id: 'ai' as const, label: 'AI 커버', icon: <Sparkles size={16} /> },
    { id: 'upload' as const, label: '직접 업로드', icon: <Upload size={16} /> },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">커버 디자인</h2>
          <p className="text-white/60 text-sm">AI로 생성하거나 직접 업로드하세요</p>
        </div>

        {/* A/B 비교 토글 */}
        <button
          onClick={() => setComparisonMode(!comparisonMode)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
            ${comparisonMode
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
            }
          `}
        >
          <ArrowLeftRight size={16} />
          A/B 비교
        </button>
      </div>

      {/* 탭 */}
      <div className="flex bg-white/5 backdrop-blur-sm rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all
              ${activeTab === tab.id
                ? 'bg-purple-500/20 text-white border border-purple-500/30'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
      >
        {activeTab === 'ai' ? <AICoverTab /> : <UploadTab />}
      </motion.div>
    </div>
  );
};

export default CoverCanvas;