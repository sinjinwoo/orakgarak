/**
 * 팔레트 선택 컴포넌트
 * 프리셋 색상과 사용자 정의 색상 선택 기능
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import type { PalettePreset } from '../../types/cover';

interface PaletteSelectorProps {
  selectedPalette: string;
  onPaletteChange: (palette: string) => void;
  className?: string;
}

const palettePresets: PalettePreset[] = [
  { id: 'purple', name: '보라', color: '#A55CFF' },
  { id: 'pink', name: '핑크', color: '#FF1B6B' },
  { id: 'blue', name: '파랑', color: '#45CAFF' },
  { id: 'orange', name: '주황', color: '#FF8C42' },
  { id: 'green', name: '초록', color: '#A8E6CF' },
  { id: 'yellow', name: '노랑', color: '#FFE066' },
  { id: 'red', name: '빨강', color: '#FF6B6B' },
  { id: 'teal', name: '청록', color: '#26D0CE' },
];

const PaletteSelector: React.FC<PaletteSelectorProps> = ({
  selectedPalette,
  onPaletteChange,
  className = '',
}) => {
  const [customColor, setCustomColor] = useState(selectedPalette);

  const handleCustomColorChange = (value: string) => {
    setCustomColor(value);
    if (value.match(/^#[0-9A-F]{6}$/i)) {
      onPaletteChange(value);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <Palette className="w-5 h-5" />
        색상 팔레트
      </h3>

      {/* 프리셋 색상들 */}
      <div className="grid grid-cols-4 gap-3">
        {palettePresets.map((preset) => (
          <motion.button
            key={preset.id}
            className={`
              relative w-full aspect-square rounded-xl border-2 transition-all duration-200
              ${selectedPalette === preset.color
                ? 'border-white ring-2 ring-white/50'
                : 'border-white/30 hover:border-white/50'
              }
            `}
            style={{ backgroundColor: preset.color }}
            onClick={() => onPaletteChange(preset.color)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`${preset.name} 색상 선택`}
          >
            {selectedPalette === preset.color && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check className="w-6 h-6 text-white drop-shadow-lg" />
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* 사용자 정의 색상 */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">
          사용자 정의 색상
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="w-12 h-12 rounded-lg border border-white/30 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            placeholder="#A55CFF"
            className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-400/30 outline-none transition-all"
            pattern="^#[0-9A-Fa-f]{6}$"
          />
        </div>
      </div>
    </div>
  );
};

export default PaletteSelector;