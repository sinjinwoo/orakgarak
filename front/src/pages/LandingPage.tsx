import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSocialAuth, useAuth } from "../hooks/useAuth";
import LPRecord from "../components/LPRecord";
import SimpleBackground from "../components/SimpleBackground";
import { Target, Zap, Album, Heart, LucideProps } from "lucide-react";

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
        <p className="text-xl text-white/80 leading-relaxed">
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
      icon: Target,
      title: "맞춤형 노래 추천",
      description: "내 음역대와 음색에 딱 맞는 노래를 추천받아보세요.",
    },
    {
      icon: Zap,
      title: "AI 보컬 코칭",
      description: "피치, 박자, 강세를 분석해서 실시간 코칭을 받을 수 있어요.",
    },
    {
      icon: Album,
      title: "나만의 앨범",
      description: "녹음본으로 개인 앨범을 만들고 AI 커버까지 생성해보세요.",
    },
    {
      icon: Heart,
      title: "소셜 피드",
      description: "다른 사용자들의 앨범을 듣고 피드백을 주고받아요.",
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
                    left: "-1.2vw",
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
                    left: "0.8vw",
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
                    border: "2px solid rgba(251, 66, 212, 0.3)",
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
                      background:
                        "linear-gradient(-45deg, rgba(175, 15, 90, 0.5)25%, rgba(15, 175, 90, 1))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
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
                    border: "2px solid rgba(66, 253, 235, 0.3)",
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
                      background:
                        "linear-gradient(-45deg, rgba(15, 175, 90, 0.5)25%, rgba(175, 15, 90, 1))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
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

      {/* ───────── Features Section with Parallax ───────── */}
      <section
        ref={featuresRef}
        className="py-20 bg-black relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-500/12 to-pink-500/12 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-500/12 to-purple-500/12 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 72, 153, 0.1) 1px, transparent 1px)`,
            backgroundSize: "45px 45px",
          }}
        ></div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center space-y-4 mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="text-4xl lg:text-5xl font-bold text-white"
              style={{
                textShadow:
                  "0 0 10px rgba(236, 72, 153, 0.3), 0 0 20px rgba(56, 189, 248, 0.3)",
              }}
            >
              오락가락의 특별한 기능들
            </h2>
          </motion.div>

          <div className="space-y-24">
            {features.map((feature, index) => (
              <FeatureItem
                key={index}
                feature={feature}
                isReversed={index % 2 !== 0}
              />
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
                fontFamily: "neon, monospace",
                textShadow:
                  "0 0 20px rgba(251, 66, 212, 0.5), 0 0 40px rgba(66, 253, 235, 0.3)",
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
              style={{ textShadow: "0 0 10px rgba(0,0,0,0.8)" }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              3분이면 당신의 음성을 분석하고 맞춤형 노래 추천을 받을 수
              있습니다.
            </motion.p>
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
                  border: "2px solid rgba(251, 66, 212, 0.4)",
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
                    background:
                      "linear-gradient(-45deg, rgba(175, 15, 90, 0.5)25%, rgba(15, 175, 90, 1))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
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
