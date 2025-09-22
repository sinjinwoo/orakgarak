/**
 * 스토리 기반 폼 컴포넌트
 * 3필드 블록 + 콘텍스트 칩 + 브랜드 잠금 섹션
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hash,
  MessageSquare,
  FileText,
  Lock,
  Unlock,
  Upload,
  Palette,
  Type,
  Sparkles,
  Plus,
  X,
  DragHandleDots2,
} from 'lucide-react';
import { useAlbumMetaStore, FONT_PRESETS } from '../../stores/albumMetaStore';

interface StoryFormProps {
  className?: string;
}

// 드래그 가능한 칩 컴포넌트
const DraggableChip: React.FC<{
  chip: {
    id: string;
    text: string;
    category: 'mood' | 'genre' | 'tempo' | 'keyword';
    weight: number;
  };
  onInsert: (chipId: string, field: 'tagline' | 'description') => void;
}> = ({ chip, onInsert }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/chip', JSON.stringify(chip));
    setIsDragging(true);
  }, [chip]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const categoryColors = {
    mood: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    genre: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    tempo: 'bg-green-500/20 text-green-300 border-green-500/30',
    keyword: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        border cursor-grab active:cursor-grabbing transition-all
        ${categoryColors[chip.category]}
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <DragHandleDots2 size={10} className="opacity-60" />
      <span>#{chip.text}</span>
    </motion.div>
  );
};

// 브랜드 잠금 섹션
const BrandLockSection: React.FC = () => {
  const {
    brandLock,
    setBrandLock,
    updateBrandFont,
    updateBrandPalette,
    uploadBrandLogo,
  } = useAlbumMetaStore();

  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 실제로는 서버에 업로드
      const logoUrl = URL.createObjectURL(file);
      uploadBrandLogo(logoUrl);
    }
  }, [uploadBrandLogo]);

  const toggleLock = useCallback(() => {
    if (brandLock) {
      setBrandLock(null);
    } else {
      setBrandLock({
        font: 'modern',
        palette: {
          primary: '#A855F7',
          secondary: '#EC4899',
          locked: true,
        },
      });
    }
  }, [brandLock, setBrandLock]);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        {brandLock ? <Lock size={16} /> : <Unlock size={16} />}
        <span className="text-sm font-medium">브랜드 잠금 (선택)</span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="ml-auto"
        >
          <Plus size={16} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 bg-white/5 rounded-lg p-4 border border-white/10"
          >
            {/* 로고 업로드 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                로고
              </label>
              <div className="flex items-center gap-3">
                {brandLock?.logo && (
                  <img
                    src={brandLock.logo}
                    alt="Brand Logo"
                    className="w-12 h-12 object-contain rounded bg-white/10"
                  />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
                >
                  <Upload size={14} />
                  {brandLock?.logo ? '변경' : '업로드'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* 폰트 프리셋 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                폰트 프리셋
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(FONT_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => updateBrandFont(key as any)}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition-all
                      ${brandLock?.font === key
                        ? 'bg-purple-500/30 border-purple-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                      }
                      border
                    `}
                    style={{ fontFamily: preset.name }}
                  >
                    <Type size={16} className="mx-auto mb-1" />
                    <div className="capitalize">{key}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 팔레트 */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                컬러 팔레트
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/60 mb-1">주색상</label>
                  <input
                    type="color"
                    value={brandLock?.palette.primary || '#A855F7'}
                    onChange={(e) => updateBrandPalette({
                      ...brandLock?.palette,
                      primary: e.target.value,
                      secondary: brandLock?.palette.secondary || '#EC4899',
                      locked: true,
                    })}
                    className="w-full h-10 rounded-lg border border-white/20 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">보조색상</label>
                  <input
                    type="color"
                    value={brandLock?.palette.secondary || '#EC4899'}
                    onChange={(e) => updateBrandPalette({
                      ...brandLock?.palette,
                      primary: brandLock?.palette.primary || '#A855F7',
                      secondary: e.target.value,
                      locked: true,
                    })}
                    className="w-full h-10 rounded-lg border border-white/20 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* 잠금 토글 */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-sm text-white/70">커버/프리뷰에 일관 적용</span>
              <button
                onClick={toggleLock}
                className={`
                  flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all
                  ${brandLock?.palette.locked
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-white/10 text-white/60'
                  }
                `}
              >
                {brandLock?.palette.locked ? <Lock size={12} /> : <Unlock size={12} />}
                {brandLock?.palette.locked ? '잠금됨' : '잠금 해제'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StoryForm: React.FC<StoryFormProps> = ({ className = '' }) => {
  const {
    coreKeywords,
    tagline,
    description,
    autoChips,
    setCoreKeywords,
    setTagline,
    setDescription,
    insertChipToField,
  } = useAlbumMetaStore();

  const [newKeyword, setNewKeyword] = useState('');
  const taglineRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // 키워드 추가
  const handleAddKeyword = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      setCoreKeywords([...coreKeywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  }, [newKeyword, coreKeywords, setCoreKeywords]);

  // 키워드 제거
  const handleRemoveKeyword = useCallback((index: number) => {
    setCoreKeywords(coreKeywords.filter((_, i) => i !== index));
  }, [coreKeywords, setCoreKeywords]);

  // 칩 드롭 핸들링
  const handleChipDrop = useCallback((
    e: React.DragEvent,
    field: 'tagline' | 'description'
  ) => {
    e.preventDefault();
    const chipData = JSON.parse(e.dataTransfer.getData('application/chip'));
    const textArea = field === 'tagline' ? taglineRef.current : descriptionRef.current;

    if (textArea) {
      const cursorPosition = textArea.selectionStart;
      insertChipToField(chipData.id, field, cursorPosition);
    }
  }, [insertChipToField]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-bold text-white mb-2">앨범 스토리 작성</h2>
        <p className="text-white/60 text-sm">
          키워드, 한 줄 소개, 상세 설명을 통해 앨범의 이야기를 만들어보세요
        </p>
      </div>

      {/* 핵심 키워드 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-white">
          <Hash size={16} />
          핵심 키워드
          <span className="text-purple-400">*</span>
        </label>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {coreKeywords.map((keyword, index) => (
              <motion.span
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm border border-purple-500/30"
              >
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(index)}
                  className="text-purple-300/60 hover:text-purple-300"
                >
                  <X size={14} />
                </button>
              </motion.span>
            ))}
          </div>

          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={handleAddKeyword}
            placeholder="키워드를 입력하고 Enter를 누르세요"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>

      {/* 짧은 문장 (한 줄 소개) */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-white">
          <MessageSquare size={16} />
          짧은 문장 (한 줄 소개)
          <span className="text-purple-400">*</span>
        </label>

        <div
          onDrop={(e) => handleChipDrop(e, 'tagline')}
          onDragOver={(e) => e.preventDefault()}
          className="relative"
        >
          <textarea
            ref={taglineRef}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="이 앨범을 한 문장으로 소개한다면?"
            rows={2}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
          />
          <div className="absolute bottom-2 right-2 text-xs text-white/40">
            {tagline.length} / 100
          </div>
        </div>
      </div>

      {/* 확장 설명 */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-white">
          <FileText size={16} />
          확장 설명
        </label>

        <div
          onDrop={(e) => handleChipDrop(e, 'description')}
          onDragOver={(e) => e.preventDefault()}
          className="relative"
        >
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="앨범에 대해 더 자세히 설명해주세요..."
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all resize-none"
          />
          <div className="absolute bottom-2 right-2 text-xs text-white/40">
            {description.length} / 500
          </div>
        </div>
      </div>

      {/* 콘텍스트 칩 */}
      {autoChips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <span className="text-sm font-medium text-white">자동 생성 칩</span>
            <span className="text-xs text-white/40">(드래그해서 위 텍스트에 삽입)</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {autoChips.map((chip) => (
              <DraggableChip
                key={chip.id}
                chip={chip}
                onInsert={insertChipToField}
              />
            ))}
          </div>
        </div>
      )}

      {/* 브랜드 잠금 섹션 */}
      <BrandLockSection />
    </div>
  );
};

export default StoryForm;