import React from 'react';
import { motion } from 'framer-motion';

const steps = [
  {
    number: '1',
    title: '음성 분석',
    description: '간단한 게임을 통해 음역대를 측정하고, 한 소절 녹음으로 음색을 분석합니다.',
    features: ['게임형 음역대 측정', '음색 및 발성 특성 추출', '개인별 맞춤 프로필 생성']
  },
  {
    number: '2', 
    title: '노래 추천',
    description: '분석된 데이터를 바탕으로 당신에게 딱 맞는 노래들을 추천해드립니다.',
    features: ['Spotify/Melon 연동', '상황별 추천 (비오는날, 회식 등)', '실시간 인기곡 반영']
  },
  {
    number: '3',
    title: '녹음 & 코칭', 
    description: 'AI가 실시간으로 피치, 박자, 강세를 분석해서 보컬 코칭을 제공합니다.',
    features: ['실시간 피치 분석', '박자 및 강세 코칭', '시각적 피드백 제공']
  },
  {
    number: '4',
    title: '앨범 제작',
    description: '녹음본을 선택해서 나만의 앨범을 만들고 AI가 생성한 커버와 함께 공유하세요.',
    features: ['AI 앨범 커버 생성', '소셜 공유 기능', '댓글 및 좋아요 시스템']
  }
];

export const ServiceExplainer: React.FC = () => {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      {/* 사이버펑크 배경 장식 요소들 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/12 to-pink-500/12 rounded-full blur-3xl animate-pulse" style={{ boxShadow: '0 0 100px rgba(6, 182, 212, 0.2)' }}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/12 to-purple-500/12 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', boxShadow: '0 0 100px rgba(236, 72, 153, 0.2)' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/6 to-pink-400/6 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s', boxShadow: '0 0 80px rgba(34, 211, 238, 0.15)' }}></div>
      </div>
      
      {/* 사이버펑크 그리드 오버레이 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '45px 45px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center space-y-4 mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.4)' }}>
            4단계로 완성하는 나만의 노래방 경험
          </h2>
        </motion.div>
        
        <div className="space-y-12">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className="flex flex-col lg:flex-row items-center gap-8"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="flex-shrink-0">
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-pink-500/30 hover:bg-black/60 hover:border-pink-400/50 transition-all duration-500 relative overflow-hidden" style={{ boxShadow: '0 0 30px rgba(251, 66, 212, 0.1)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 backdrop-blur-sm text-pink-400 rounded-full flex items-center justify-center text-2xl font-bold border border-pink-400/40 relative z-10" style={{ boxShadow: '0 0 20px rgba(251, 66, 212, 0.3)' }}>
                    {step.number}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <h3 className="text-2xl font-bold text-white mb-3" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.6)' }}>{step.title}</h3>
                <p className="text-white/90 mb-4" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>{step.description}</p>
                <ul className="space-y-2">
                  {step.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-white/80" style={{ textShadow: '0 0 3px rgba(0,0,0,0.8)' }}>
                      <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 사이버펑크 사운드 웨이브 시각화 */}
              <div className="flex-shrink-0">
                <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-pink-500/30 hover:bg-black/60 hover:border-pink-400/50 transition-all duration-500 relative overflow-hidden" style={{ boxShadow: '0 0 30px rgba(251, 66, 212, 0.1)' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="w-32 h-20 bg-black/60 rounded-lg flex items-end justify-center space-x-1 border border-pink-400/40 relative z-10" style={{ boxShadow: '0 0 15px rgba(251, 66, 212, 0.2)' }}>
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="rounded-full"
                        style={{
                          width: '4px',
                          height: `${Math.random() * 16 + 8}px`,
                          backgroundColor: i % 2 === 0 ? 'rgba(251, 66, 212, 0.8)' : 'rgba(66, 253, 235, 0.8)',
                          boxShadow: i % 2 === 0 ? '0 0 8px rgba(251, 66, 212, 0.8)' : '0 0 8px rgba(66, 253, 235, 0.8)'
                        }}
                        animate={{
                          height: [`${Math.random() * 16 + 8}px`, `${Math.random() * 20 + 12}px`, `${Math.random() * 16 + 8}px`]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.1
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
