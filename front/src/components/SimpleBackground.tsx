import React from 'react';

const SimpleBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      {/* 사이버펑크 배경 - 제공해주신 스타일 적용 */}
      <div 
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(-45deg, rgba(5, 15, 10, .35)15%, rgba(15, 5, 10, .85)), url(https://images.unsplash.com/photo-1519608487953-e999c86e7455?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80) center 25% no-repeat fixed`,
          backgroundSize: 'cover'
        }}
      ></div>
      
      {/* 네온 글로우 효과 - 사이버펑크 스타일 */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ boxShadow: '0 0 100px rgba(251, 66, 212, 0.3)' }}></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-cyan-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', boxShadow: '0 0 100px rgba(66, 253, 235, 0.3)' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-pink-400/10 to-cyan-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s', boxShadow: '0 0 80px rgba(251, 66, 212, 0.2)' }}></div>
      
      {/* 네온 파티클들 - 사이버펑크 색상 */}
      <div className="absolute top-20 left-20 w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ boxShadow: '0 0 20px rgba(251, 66, 212, 0.8)' }}></div>
      <div className="absolute top-40 right-32 w-4 h-4 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '1s', boxShadow: '0 0 20px rgba(66, 253, 235, 0.8)' }}></div>
      <div className="absolute bottom-32 left-32 w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '2s', boxShadow: '0 0 20px rgba(251, 66, 212, 0.8)' }}></div>
      <div className="absolute bottom-20 right-20 w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s', boxShadow: '0 0 20px rgba(66, 253, 235, 0.8)' }}></div>
      
      {/* 사이버펑크 그리드 효과 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(251, 66, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(66, 253, 235, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* 네온 파티클 효과 - 사이버펑크 색상 */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              backgroundColor: i % 2 === 0 ? 'rgba(251, 66, 212, 0.6)' : 'rgba(66, 253, 235, 0.6)',
              boxShadow: i % 2 === 0 ? '0 0 10px rgba(251, 66, 212, 0.8)' : '0 0 10px rgba(66, 253, 235, 0.8)'
            }}
          />
        ))}
      </div>
      
      {/* 사이버펑크 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10"></div>
    </div>
  );
};

export default SimpleBackground;
