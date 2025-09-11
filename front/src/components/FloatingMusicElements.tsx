import React from 'react';
import { motion } from 'framer-motion';
import { Music, Mic, Headphones } from 'lucide-react';

export const FloatingMusicElements: React.FC = () => {
  return (
    <>
      {/* 음표 아이콘들 */}
      <motion.div
        className="absolute top-20 left-10 text-primary/20"
        animate={{
          y: [-10, 10, -10],
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Music className="w-8 h-8" />
      </motion.div>

      <motion.div
        className="absolute top-40 right-20 text-accent/20"
        animate={{
          y: [10, -10, 10],
          rotate: [0, -5, 5, 0]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Mic className="w-6 h-6" />
      </motion.div>

      <motion.div
        className="absolute bottom-40 left-20 text-purple-500/20"
        animate={{
          y: [-5, 15, -5],
          rotate: [0, 10, -10, 0]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Headphones className="w-10 h-10" />
      </motion.div>

      <motion.div
        className="absolute bottom-20 right-10 text-pink-500/20"
        animate={{
          y: [15, -5, 15],
          rotate: [0, -10, 10, 0]
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Music className="w-7 h-7" />
      </motion.div>
    </>
  );
};
