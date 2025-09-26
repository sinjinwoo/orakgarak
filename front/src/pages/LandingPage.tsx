import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSocialAuth, useAuth } from "../hooks/useAuth";
import LPRecord from "../components/LPRecord";
import SimpleBackground from "../components/SimpleBackground";
import { Music, Brain, Disc, Users, LucideProps } from "lucide-react";

// ───────── Feature Item Component with Parallax ─────────
interface Feature {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  title: string;
  description: string;
}

const FeatureItem: React.FC<{ feature: Feature; isReversed: boolean }> = ({
  feature,
  isReversed,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Move icon and text at different speeds
  const iconY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["15%", "-15%"]);

  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      className={`flex flex-col lg:flex-row items-center gap-12 ${
        isReversed ? "lg:flex-row-reverse" : ""
      }`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
    >
      <motion.div
        style={{ y: iconY }}
        className="flex-1 lg:w-1/2 flex justify-center"
      >
        <div
          className="bg-black/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-pink-500/30 hover:bg-black/60 hover:border-pink-400/50 transition-all duration-500 relative overflow-hidden w-80 h-80 flex items-center justify-center"
          style={{ boxShadow: "0 0 40px rgba(251, 66, 212, 0.15)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
          <Icon
            className="w-32 h-32 text-pink-400"
            style={{ filter: "drop-shadow(0 0 15px rgba(251, 66, 212, 0.7))" }}
          />
        </div>
      </motion.div>

      <motion.div
        style={{ y: textY }}
        className={`flex-1 lg:w-1/2 text-center ${
          isReversed ? "lg:text-right" : "lg:text-left"
        }`}
      >
        <h3
          className="text-3xl font-bold text-white mb-4"
          style={{ textShadow: "0 0 10px rgba(56, 189, 248, 0.4)" }}
        >
          {feature.title}
        </h3>
        <p className="text-lg text-white/90 leading-relaxed max-w-2xl">
          {feature.description}
        </p>
      </motion.div>
    </motion.div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, isLoading } = useSocialAuth();
  const { isAuthenticated } = useAuth();
  const featuresRef = useRef<HTMLElement>(null);

  const handleEnterClick = async () => {
    if (isAuthenticated) {
      navigate("/feed");
    } else {
      const success = await loginWithGoogle();
      if (success) navigate("/onboarding/range");
    }
  };

  const handleExploreClick = () => {
    featuresRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const features: Feature[] = [
    {
      icon: Music,
      title: "맞춤형 노래 추천",
      description: "AI가 당신의 음역대, 음색, 선호 장르를 분석하여 완벽하게 맞는 노래를 추천합니다. 기존에 부르기 어려웠던 곡들도 당신의 목소리에 최적화된 키로 제공되어 누구나 쉽게 따라 부를 수 있어요. 매일 새로운 추천곡으로 음악적 경험을 넓혀보세요.",
    },
    {
      icon: Brain,
      title: "AI 보컬 코칭",
      description: "실시간으로 피치, 박자, 강세, 호흡을 분석하여 전문가 수준의 보컬 코칭을 제공합니다. 노래하는 동안 즉시 피드백을 받아 부족한 부분을 바로 개선할 수 있어요. 개인별 맞춤 연습 계획과 함께 보컬 실력을 단계적으로 향상시켜보세요.",
    },
    {
      icon: Disc,
      title: "나만의 앨범",
      description: "녹음한 곡들로 개인 앨범을 제작하고, AI가 생성한 독창적인 앨범 커버까지 완성해보세요. 다양한 스타일과 테마의 커버 디자인을 선택할 수 있으며, 트랙 순서도 자유롭게 조정 가능합니다. 나만의 음악 컬렉션을 세상과 공유해보세요.",
    },
    {
      icon: Users,
      title: "소셜 피드",
      description: "전 세계 사용자들이 만든 앨범을 감상하고, 좋아요와 댓글로 소통할 수 있는 음악 커뮤니티입니다. 다양한 장르와 스타일의 음악을 발견하고, 다른 사용자들과 음악적 영감을 주고받아보세요. 새로운 아티스트를 발견하는 즐거움도 함께합니다.",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* ───────── Hero Section (Restored to Original) ───────── */}
      <section className="relative min-h-[92vh] overflow-hidden">
        <div className="absolute inset-0 -z-0 pointer-events-none">
          <SimpleBackground />
        </div>
        <div className="pt-20 md:pt-24" />
        <div className="mx-auto w-full max-w-[1600px] px-6 relative">
          <div className="grid grid-cols-12 items-center min-h-[60vh] relative">
            <motion.div
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[33%] z-[60] pointer-events-none"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="origin-center scale-[2.3] md:scale-[2.6] xl:scale-[3.0] relative">
                <div className="absolute -inset-16 -z-10 rounded-full bg-[radial-gradient(circle,rgba(80,120,255,.25),rgba(80,120,255,0)_60%)] blur-2xl" />
                <LPRecord />
              </div>
            </motion.div>
            <motion.div
              className="col-span-12 md:col-span-6 md:col-start-6 relative z-[70] w-full md:w-[860px] md:-ml-[3vw] text-left"
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-block">
                <motion.div
                  className="font-bold"
                  style={{
                    fontFamily: "neon, monospace",
                    color: "#FB42D4",
                    fontSize: "min(12vw, 9rem)",
                    lineHeight: "0.9",
                    textShadow: "0 0 3vw #F40AD5",
                    position: "relative",
                    left: "-4.5vw",
                    cursor: "default",
                    animation: "cyber 2.2s ease-in infinite",
                    letterSpacing: "0.04em",
                  }}
                >
                  ORAK
                </motion.div>
                <motion.div
                  className="font-bold"
                  style={{
                    fontFamily: "neon, monospace",
                    color: "#42FDEB",
                    fontSize: "min(12vw, 9rem)",
                    lineHeight: "0.9",
                    textShadow: "0 0 3vw #23F6EF",
                    position: "relative",
                    left: "6.0vw",
                    cursor: "default",
                    animation: "zone 3.2s ease-out infinite",
                    letterSpacing: "0.04em",
                  }}
                >
                  GARAK
                </motion.div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <motion.button
                  className="relative overflow-hidden"
                  style={{
                    width: "15rem",
                    height: "4rem",
                    fontFamily: "neon, monospace",
                    textAlign: "center",
                    padding: "12px",
                    fontSize: "24pt",
                    fontWeight: 900,
                    backgroundColor: "rgba(30,10,20,.6)",
                    borderRadius: "2rem",
                    cursor: "pointer",
                    border: "3px solid rgba(251, 66, 212, 0.6)",
                    boxShadow: "0 0 30px rgba(251, 66, 212, 0.2)",
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 50px rgba(251, 66, 212, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnterClick}
                  disabled={isLoading}
                >
                  <span
                    style={{
                      color: '#ffffff',
                      textShadow: '0 0 10px rgba(251, 66, 212, 0.8), 0 0 20px rgba(251, 66, 212, 0.6), 0 0 30px rgba(251, 66, 212, 0.4)',
                      fontWeight: 'bold',
                      filter: 'drop-shadow(0 0 5px rgba(251, 66, 212, 0.5))'
                    }}
                  >
                    {isLoading
                      ? "Loading..."
                      : isAuthenticated
                      ? "Go to Feed"
                      : "Enter"}
                  </span>
                </motion.button>
                <motion.button
                  className="relative overflow-hidden"
                  style={{
                    width: "12rem",
                    height: "4rem",
                    fontFamily: "neon, monospace",
                    textAlign: "center",
                    padding: "12px",
                    fontSize: "20pt",
                    fontWeight: 900,
                    backgroundColor: "rgba(10,30,20,.6)",
                    borderRadius: "2rem",
                    cursor: "pointer",
                    border: "3px solid rgba(66, 253, 235, 0.6)",
                    boxShadow: "0 0 30px rgba(66, 253, 235, 0.2)",
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 0 50px rgba(66, 253, 235, 0.4)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExploreClick}
                >
                  <span
                    style={{
                      color: '#ffffff',
                      textShadow: '0 0 10px rgba(66, 253, 235, 0.8), 0 0 20px rgba(66, 253, 235, 0.6), 0 0 30px rgba(66, 253, 235, 0.4)',
                      fontWeight: 'bold',
                      filter: 'drop-shadow(0 0 5px rgba(66, 253, 235, 0.5))'
                    }}
                  >
                    Explore
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────── Enhanced Features Section with Advanced Parallax ───────── */}
      <section
        ref={featuresRef}
        className="py-32 bg-black relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(251, 66, 212, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(66, 253, 235, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(139, 69, 255, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)
          `
        }}
      >
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Floating Particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 3 === 0 ? 'rgba(251, 66, 212, 0.6)' : 
                           i % 3 === 1 ? 'rgba(66, 253, 235, 0.6)' : 
                           'rgba(139, 69, 255, 0.6)',
                boxShadow: i % 3 === 0 ? '0 0 20px rgba(251, 66, 212, 0.8)' :
                           i % 3 === 1 ? '0 0 20px rgba(66, 253, 235, 0.8)' :
                           '0 0 20px rgba(139, 69, 255, 0.8)'
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
          
          {/* Enhanced Gradient Orbs */}
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/20 to-pink-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.6, 0.3, 0.6]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* New Central Orb */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-purple-500/15 to-cyan-500/15 rounded-full blur-2xl"
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>
        {/* Enhanced Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251, 66, 212, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(66, 253, 235, 0.3) 1px, transparent 1px),
              linear-gradient(45deg, rgba(139, 69, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px, 60px 60px, 120px 120px"
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center space-y-6 mb-24"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-5xl lg:text-6xl font-bold"
              style={{
                color: "#ffffff",
                textShadow: "0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(66, 253, 235, 0.4), 0 0 45px rgba(251, 66, 212, 0.3)"
              }}
              animate={{
                textShadow: [
                  "0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(66, 253, 235, 0.4), 0 0 45px rgba(251, 66, 212, 0.3)",
                  "0 0 20px rgba(255, 255, 255, 1), 0 0 35px rgba(66, 253, 235, 0.6), 0 0 50px rgba(251, 66, 212, 0.5)",
                  "0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(66, 253, 235, 0.4), 0 0 45px rgba(251, 66, 212, 0.3)"
                ]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              오락가락의 특별한 기능들
            </motion.h2>
            
            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-pink-500 via-cyan-500 to-purple-500 mx-auto rounded-full"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </motion.div>

          <div className="space-y-16">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <FeatureItem
                  feature={feature}
                  isReversed={index % 2 !== 0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: `linear-gradient(-45deg, rgba(5, 15, 10, .4)15%, rgba(15, 5, 10, .7)), url(https://cdn1.epicgames.com/ue/product/Screenshot/Cyberpunk%20CityStreet1-1920x1080-665de4310b3a9a5dae52d15127d99042.jpg?resize=1&w=1920) center center no-repeat fixed`,
            backgroundSize: "cover",
          }}
        ></div>
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-500/15 to-cyan-500/15 rounded-full blur-3xl animate-pulse"
            style={{ boxShadow: "0 0 120px rgba(251, 66, 212, 0.2)" }}
          ></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
            style={{
              animationDelay: "1s",
              boxShadow: "0 0 120px rgba(66, 253, 235, 0.2)",
            }}
          ></div>
        </div>
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(rgba(251, 66, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(66, 253, 235, 0.1) 1px, transparent 1px)`,
              backgroundSize: "50px 50px",
            }}
          ></div>
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
                textShadow:
                  "0 0 20px rgba(251, 66, 212, 0.5), 0 0 40px rgba(66, 253, 235, 0.3)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
             지금 바로 시작해보세요! 
            </motion.h2>
            <motion.div
              className="max-w-3xl mx-auto space-y-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.p
                className="text-xl text-white/95 font-medium"
                style={{ 
                  textShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
                  background: "linear-gradient(90deg, #ffffff, #e0e7ff, #ffffff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                단 3분이면 당신의 음성을 완벽하게 분석하고
              </motion.p>
              <motion.p
                className="text-xl text-white/95 font-medium"
                style={{ 
                  textShadow: "0 0 15px rgba(255, 255, 255, 0.3)",
                  background: "linear-gradient(90deg, #ffffff, #e0e7ff, #ffffff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                당신만을 위한 맞춤형 노래 추천을 받을 수 있습니다!
              </motion.p>
              <motion.div
                className="flex items-center justify-center space-x-2 mt-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <motion.div
                  className="w-2 h-2 bg-pink-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <motion.div
                  className="w-2 h-2 bg-cyan-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                />
                <motion.div
                  className="w-2 h-2 bg-purple-400 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <motion.button
                className="relative overflow-hidden"
                style={{
                  marginTop: "20px",
                  width: "18rem",
                  height: "5rem",
                  fontFamily: "neon, monospace",
                  textAlign: "center",
                  padding: "16px",
                  fontSize: "28pt",
                  fontWeight: "900",
                  backgroundColor: "rgba(30,10,20,.7)",
                  borderRadius: "2rem",
                  cursor: "pointer",
                  border: "3px solid rgba(251, 66, 212, 0.6)",
                  boxShadow: "0 0 40px rgba(251, 66, 212, 0.3)",
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 60px rgba(251, 66, 212, 0.5)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEnterClick}
                disabled={isLoading}
              >
                <span
                  style={{
                    color: '#ffffff',
                    textShadow: '0 0 15px rgba(251, 66, 212, 0.9), 0 0 25px rgba(251, 66, 212, 0.7), 0 0 35px rgba(251, 66, 212, 0.5)',
                    fontWeight: 'bold',
                    filter: 'drop-shadow(0 0 8px rgba(251, 66, 212, 0.6))'
                  }}
                >
                  {isLoading
                    ? "Loading..."
                    : isAuthenticated
                    ? "GO TO FEED"
                    : "START NOW"}
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
