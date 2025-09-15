import React from 'react';
import { motion } from 'framer-motion';

interface EqualizerBarsProps {
  bars: number;
  className?: string;
}

export const EqualizerBars: React.FC<EqualizerBarsProps> = ({ bars, className = '' }) => {
  return (
    <div className={`flex items-end space-x-1 ${className}`}>
      {[...Array(bars)].map((_, i) => (
        <motion.div
          key={i}
          className="bg-gradient-to-t from-primary to-purple-600 rounded-full"
          style={{
            width: '3px',
            height: `${Math.random() * 20 + 10}px`
          }}
          animate={{
            height: [`${Math.random() * 20 + 10}px`, `${Math.random() * 30 + 15}px`, `${Math.random() * 20 + 10}px`]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
