/**
 * Common Step Header Component for Album Creation
 * 앨범 생성 단계의 공통 헤더 컴포넌트
 */

import React from 'react';
import { motion } from 'framer-motion';

interface StepHeaderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

const StepHeader: React.FC<StepHeaderProps> = ({
  title,
  description,
  icon,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 ${className}`}
    >
      <div className="flex items-center gap-4 mb-4">
        {icon && (
          <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 rounded-xl border border-fuchsia-400/30">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-white/70 text-lg">{description}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StepHeader;