import React from 'react';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const GlassmorphismCard: React.FC<GlassmorphismCardProps> = ({ 
  children, 
  className = '',
  delay = 0 
}) => {
  return (
    <div 
      className={`backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl shadow-xl ${className}`}
      style={{
        animationDelay: `${delay}s`
      }}
    >
      {children}
    </div>
  );
};
