import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSocialAuth } from '../hooks/useAuth';
import { ServiceExplainer } from '../components/ServiceExplainer';
import LPRecord from '../components/LPRecord';
import SimpleBackground from '../components/SimpleBackground';
import { Music, Mic, Target, Zap, Album, Heart } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoading } = useSocialAuth();

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success) navigate('/onboarding/range');
  };

  const features = [
    {
      icon: Target,
      title: '맞춤형 노래 추천',
      description: '내 음역대와 음색에 딱 맞는 노래를 추천받아보세요'
    },
    {
      icon: Zap,
      title: 'AI 보컬 코칭',
      description: '피치, 박자, 강세를 분석해서 실시간 코칭을 받을 수 있어요'
    },
    {
      icon: Album,
      title: '나만의 앨범',
      description: '녹음본으로 개인 앨범을 만들고 AI 커버까지 생성해보세요'
    },
    {
      icon: Heart,
      title: '소셜 피드',
      description: '다른 사용자들의 앨범을 듣고 피드백을 주고받아요'
    }
  ];


  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Simple Background - 첫 섹션에만 적용 */}
        <SimpleBackground />
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-2 text-white/80"
                >
                </motion.div>

                {/* 사이버펑크 네온 타이틀 */}
                <div className="space-y-4 text-center">
                  <motion.div 
                    className="text-6xl md:text-8xl font-bold mb-4"
                    style={{
                      fontFamily: 'neon, monospace',
                      color: '#FB42D4',
                      fontSize: '9vw',
                      lineHeight: '9vw',
                      textShadow: '0 0 3vw #F40AD5',
                      marginLeft: '0px',
                      cursor: 'default',
                      animation: 'cyber 2.2s ease-in infinite'
                    }}
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                  >
                    ORAK
                  </motion.div>
                  <motion.div 
                    className="text-6xl md:text-8xl font-bold"
                    style={{
                      fontFamily: 'neon, monospace',
                      color: '#42FDEB',
                      fontSize: '9vw',
                      lineHeight: '9vw',
                      textShadow: '0 0 3vw #23F6EF',
                      marginLeft: '300px',
                      cursor: 'default',
                      animation: 'zone 3.2s ease-out infinite'
                    }}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, delay: 0.8 }}
                  >
                    GARAK
                  </motion.div>
                </div>
              </div>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {/* 사이버펑크 메인 버튼 */}
                <motion.button
                  className="relative overflow-hidden"
                  style={{
                    marginTop: '20px',
                    width: '15rem',
                    height: '4rem',
                    fontFamily: 'neon, monospace',
                    textAlign: 'center',
                    padding: '12px',
                    fontSize: '24pt',
                    fontWeight: '900',
                    backgroundColor: 'rgba(30,10,20,.6)',
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    border: '2px solid rgba(251, 66, 212, 0.3)',
                    boxShadow: '0 0 30px rgba(251, 66, 212, 0.2)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 0 50px rgba(251, 66, 212, 0.4)'
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <span 
                    style={{
                      background: 'linear-gradient(-45deg, rgba(175, 15, 90, 0.5)25%, rgba(15, 175, 90, 1))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {isLoading ? 'Loading...' : 'Enter'}
                  </span>
                </motion.button>
                
                {/* 사이버펑크 보조 버튼 */}
                <motion.button
                  className="relative overflow-hidden"
                  style={{
                    marginTop: '20px',
                    width: '12rem',
                    height: '4rem',
                    fontFamily: 'neon, monospace',
                    textAlign: 'center',
                    padding: '12px',
                    fontSize: '20pt',
                    fontWeight: '900',
                    backgroundColor: 'rgba(10,30,20,.6)',
                    borderRadius: '2rem',
                    cursor: 'pointer',
                    border: '2px solid rgba(66, 253, 235, 0.3)',
                    boxShadow: '0 0 30px rgba(66, 253, 235, 0.2)'
                  }}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: '0 0 50px rgba(66, 253, 235, 0.4)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span 
                    style={{
                      background: 'linear-gradient(-45deg, rgba(15, 175, 90, 0.5)25%, rgba(175, 15, 90, 1))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    Explore
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="relative flex justify-center items-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* LP 레코드 */}
              <div className="relative">
                <LPRecord />
                
                {/* 플로팅 음표 아이콘들 */}
                <div className="absolute -top-6 -right-6 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg animate-float">
                  <Music className="w-6 h-6 text-white animate-spin-slow" />
                </div>
                
                <div className="absolute -bottom-6 -left-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <Mic className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="py-20 bg-black relative overflow-hidden">
        {/* 사이버펑크 배경 장식 요소들 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ boxShadow: '0 0 120px rgba(6, 182, 212, 0.2)' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/15 to-purple-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', boxShadow: '0 0 120px rgba(236, 72, 153, 0.2)' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400/8 to-pink-400/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s', boxShadow: '0 0 100px rgba(34, 211, 238, 0.15)' }}></div>
        </div>
        
        {/* 사이버펑크 그리드 오버레이 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
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
              오락가락의 특별한 기능들
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8), 0 0 10px rgba(0,0,0,0.6)' }}>
              단순한 노래 검색을 넘어, 당신만을 위한 맞춤형 노래방 경험을 제공합니다.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl p-8 h-full text-center space-y-6 shadow-2xl border border-pink-500/30 hover:shadow-3xl hover:bg-black/60 hover:border-pink-400/50 transition-all duration-500 group relative overflow-hidden" style={{ boxShadow: '0 0 30px rgba(251, 66, 212, 0.1)' }}>
                    {/* 사이버펑크 글로우 효과 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <motion.div
                      className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-500/20 to-cyan-500/20 backdrop-blur-sm flex items-center justify-center mx-auto shadow-lg border border-pink-400/40 relative"
                      whileHover={{ 
                        scale: 1.1,
                        rotate: 5
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ boxShadow: '0 0 20px rgba(251, 66, 212, 0.3)' }}
                    >
                      <Icon className="w-10 h-10 text-pink-400 animate-pulse-slow" style={{ filter: 'drop-shadow(0 0 8px rgba(251, 66, 212, 0.8))' }} />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-pink-300 transition-colors duration-300 relative z-10" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(251, 66, 212, 0.3)' }}>{feature.title}</h3>
                    <p className="text-white/80 leading-relaxed group-hover:text-white/90 transition-colors duration-300 relative z-10" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Explainer */}
      <ServiceExplainer />

      {/* CTA Section */}
      {/* 사이버펑크 도시 배경이 있는 마지막 섹션 */}
      <section className="relative py-20 overflow-hidden">
        {/* 사이버펑크 도시 배경 */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            background: `linear-gradient(-45deg, rgba(5, 15, 10, .4)15%, rgba(15, 5, 10, .7)), url(https://cdn1.epicgames.com/ue/product/Screenshot/Cyberpunk%20CityStreet1-1920x1080-665de4310b3a9a5dae52d15127d99042.jpg?resize=1&w=1920) center center no-repeat fixed`,
            backgroundSize: 'cover'
          }}
        ></div>
        
        {/* 사이버펑크 글로우 효과 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse" style={{ boxShadow: '0 0 120px rgba(251, 66, 212, 0.2)' }}></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', boxShadow: '0 0 120px rgba(66, 253, 235, 0.2)' }}></div>
        </div>
        
        {/* 사이버펑크 그리드 오버레이 */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(251, 66, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(66, 253, 235, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center space-y-8 text-white"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold"
              style={{
                fontFamily: 'neon, monospace',
                textShadow: '0 0 20px rgba(251, 66, 212, 0.5), 0 0 40px rgba(66, 253, 235, 0.3)'
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              지금 바로 시작해보세요
            </motion.h2>
            <motion.p 
              className="text-xl text-white/90 max-w-2xl mx-auto"
              style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              3분이면 당신의 음성을 분석하고 맞춤형 노래 추천을 받을 수 있습니다.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* 사이버펑크 버튼 */}
              <motion.button
                className="relative overflow-hidden"
                style={{
                  marginTop: '20px',
                  width: '18rem',
                  height: '5rem',
                  fontFamily: 'neon, monospace',
                  textAlign: 'center',
                  padding: '16px',
                  fontSize: '28pt',
                  fontWeight: '900',
                  backgroundColor: 'rgba(30,10,20,.7)',
                  borderRadius: '2rem',
                  cursor: 'pointer',
                  border: '2px solid rgba(251, 66, 212, 0.4)',
                  boxShadow: '0 0 40px rgba(251, 66, 212, 0.3)'
                }}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: '0 0 60px rgba(251, 66, 212, 0.5)'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <span 
                  style={{
                    background: 'linear-gradient(-45deg, rgba(175, 15, 90, 0.5)25%, rgba(15, 175, 90, 1))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  {isLoading ? 'Loading...' : 'START NOW'}
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
