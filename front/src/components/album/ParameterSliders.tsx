/**
 * 파라미터 슬라이더 컴포넌트
 * 밝기, 채도, 그레인 조절 슬라이더들
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Droplets, Zap } from 'lucide-react';

interface SliderConfig {
  key: 'brightness' | 'saturation' | 'grain';
  label: string;
  icon: React.ReactNode;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

interface ParameterSlidersProps {
  brightness: number;
  saturation: number;
  grain: number;
  onParameterChange: (key: string, value: number) => void;
  className?: string;
}

const sliderConfigs: SliderConfig[] = [
  {
    key: 'brightness',
    label: '밝기',
    icon: <Sun className="w-4 h-4" />,
    min: -0.5,
    max: 0.5,
    step: 0.1,
  },
  {
    key: 'saturation',
    label: '채도',
    icon: <Droplets className="w-4 h-4" />,
    min: -0.3,
    max: 0.5,
    step: 0.1,
  },
  {
    key: 'grain',
    label: '그레인',
    icon: <Zap className="w-4 h-4" />,
    min: 0,
    max: 0.3,
    step: 0.05,
  },
];

const ParameterSliders: React.FC<ParameterSlidersProps> = ({
  brightness,
  saturation,
  grain,
  onParameterChange,
  className = '',
}) => {
  const values = { brightness, saturation, grain };

  const formatValue = (value: number): string => {
    return Math.round(value * 100).toString();
  };

  const getSliderProgress = (value: number, min: number, max: number): number => {
    return ((value - min) / (max - min)) * 100;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white">파라미터 조절</h3>

      {sliderConfigs.map((config) => {
        const currentValue = values[config.key];
        const progress = getSliderProgress(currentValue, config.min, config.max);

        return (
          <div key={config.key} className="space-y-3">
            {/* 라벨과 값 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-white/90">
                {config.icon}
                {config.label}
              </label>
              <span className="text-sm font-mono text-white/70 min-w-[3rem] text-right">
                {formatValue(currentValue)}%
              </span>
            </div>

            {/* 슬라이더 */}
            <div className="relative">
              <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={currentValue}
                onChange={(e) => onParameterChange(config.key, parseFloat(e.target.value))}
                className="slider-input w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #A55CFF 0%, #A55CFF ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`,
                }}
                aria-label={`${config.label} 조절`}
                aria-valuenow={Math.round(currentValue * 100)}
                aria-valuemin={Math.round(config.min * 100)}
                aria-valuemax={Math.round(config.max * 100)}
              />

              {/* 슬라이더 썸 */}
              <motion.div
                className="absolute top-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-fuchsia-400 pointer-events-none"
                style={{
                  left: `calc(${progress}% - 10px)`,
                  transform: 'translateY(-50%)',
                }}
                whileHover={{ scale: 1.2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>

            {/* 범위 표시 */}
            <div className="flex justify-between text-xs text-white/50">
              <span>{Math.round(config.min * 100)}%</span>
              <span>{Math.round(config.max * 100)}%</span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .slider-input::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #A55CFF;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .slider-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid #A55CFF;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .slider-input:focus {
          outline: none;
        }

        .slider-input:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(165, 92, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default ParameterSliders;