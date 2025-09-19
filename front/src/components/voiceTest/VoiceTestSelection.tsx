import React, { useState, useEffect } from 'react';
import { Mic, Play, Upload, ArrowLeft, Zap, Database } from 'lucide-react';

interface VoiceTestSelectionProps {
  onNewRecording: () => void;
  onUseExisting: (recording: { id: string; title: string }) => void;
  onBack: () => void;
}

const VoiceTestSelection: React.FC<VoiceTestSelectionProps> = ({ 
  onNewRecording, 
  onUseExisting, 
  onBack 
}) => {
  const handleNewRecording = () => {
    onNewRecording();
  };

  const handleUseExisting = () => {
    console.log('🎵 기존 녹음본 사용 버튼 클릭됨');
    // 기존 녹음본 선택 화면으로 이동
    const mockRecording = { id: 'mock', title: 'Mock Recording' };
    onUseExisting(mockRecording);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'black',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'neon, monospace'
    }}>
      {/* 메인 랜딩 페이지와 동일한 배경 효과 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 80%, rgba(251, 66, 212, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(66, 253, 235, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(175, 15, 90, 0.05) 0%, transparent 50%)
        `,
        animation: 'cyberGlow 4s ease-in-out infinite alternate'
      }} />

      {/* 메인 컨테이너 */}
      <div style={{
        width: '900px',
        maxHeight: '80vh',
        background: 'rgba(30,10,20,.6)',
        borderRadius: '20px',
        border: '2px solid rgba(251, 66, 212, 0.3)',
        boxShadow: '0 0 30px rgba(251, 66, 212, 0.2), inset 0 0 30px rgba(251, 66, 212, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        position: 'relative',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden'
      }}>
        {/* 뒤로가기 버튼 */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(30,10,20,.6)',
            border: '2px solid rgba(251, 66, 212, 0.3)',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            color: '#FB42D4',
            boxShadow: '0 0 20px rgba(251, 66, 212, 0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(251, 66, 212, 0.2)';
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(251, 66, 212, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(30,10,20,.6)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 66, 212, 0.2)';
          }}
        >
          <ArrowLeft size={24} />
        </button>

        {/* 제목 */}
        <div style={{
          textAlign: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#FB42D4',
            marginBottom: '10px',
            textShadow: '0 0 20px #F40AD5',
            fontFamily: 'neon, monospace',
            animation: 'cyber 2.2s ease-in infinite'
          }}>
            🎤 음성 테스트 선택
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#42FDEB',
            margin: 0,
            textShadow: '0 0 10px #23F6EF'
          }}>
            새로운 녹음을 하거나 기존 녹음본을 사용하세요
          </p>
        </div>

        {/* 선택 옵션들 */}
        <div style={{
          display: 'flex',
          gap: '30px',
          marginBottom: '30px'
        }}>
          {/* 새로 녹음하기 */}
          <div style={{
            flex: 1,
            background: 'rgba(30,10,20,.6)',
            border: '2px solid rgba(251, 66, 212, 0.3)',
            borderRadius: '15px',
            padding: '30px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(251, 66, 212, 0.2)'
          }}
          onClick={handleNewRecording}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(251, 66, 212, 0.1)';
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(251, 66, 212, 0.4)';
            e.currentTarget.style.borderColor = 'rgba(251, 66, 212, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(30,10,20,.6)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(251, 66, 212, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(251, 66, 212, 0.3)';
          }}
          >
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(251, 66, 212, 0.3)',
              borderRadius: '20px',
              padding: '5px 10px',
              fontSize: '12px',
              color: '#FB42D4',
              fontWeight: 'bold',
              textShadow: '0 0 10px #F40AD5'
            }}>
              NEW
            </div>
            
            <Mic size={60} color="#FB42D4" style={{ marginBottom: '20px' }} />
            <h3 style={{
              fontSize: '24px',
              color: '#FB42D4',
              marginBottom: '15px',
              fontWeight: 'bold',
              textShadow: '0 0 10px #F40AD5'
            }}>
              새로 녹음하기
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#42FDEB',
              lineHeight: '1.5',
              margin: 0,
              textShadow: '0 0 5px #23F6EF'
            }}>
              마이크로 "떳다떳다 비행기"를<br />
              새롭게 녹음합니다
            </p>
          </div>

          {/* 기존 녹음본 사용하기 */}
          <div 
            onClick={handleUseExisting}
            style={{
            flex: 1,
            background: 'rgba(30,10,20,.6)',
            border: '2px solid rgba(66, 253, 235, 0.3)',
            borderRadius: '15px',
            padding: '30px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(66, 253, 235, 0.2)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(66, 253, 235, 0.1)';
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(66, 253, 235, 0.4)';
            e.currentTarget.style.borderColor = 'rgba(66, 253, 235, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(30,10,20,.6)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(66, 253, 235, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(66, 253, 235, 0.3)';
          }}
          >
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(66, 253, 235, 0.3)',
              borderRadius: '20px',
              padding: '5px 10px',
              fontSize: '12px',
              color: '#42FDEB',
              fontWeight: 'bold',
              textShadow: '0 0 10px #23F6EF'
            }}>
              EXISTING
            </div>
            
            <Database size={60} color="#42FDEB" style={{ marginBottom: '20px' }} />
            <h3 style={{
              fontSize: '24px',
              color: '#42FDEB',
              marginBottom: '15px',
              fontWeight: 'bold',
              textShadow: '0 0 10px #23F6EF'
            }}>
              기존 녹음본 사용
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#FB42D4',
              lineHeight: '1.5',
              margin: 0,
              textShadow: '0 0 5px #F40AD5'
            }}>
              이전에 녹음한<br />
              "떳다떳다 비행기"를 사용합니다
            </p>
          </div>
        </div>


        {/* 안내 메시지 */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '14px',
          color: '#888'
        }}>
          💡 새로운 녹음은 더 정확한 분석을 제공하며, 기존 녹음본은 빠른 테스트가 가능합니다
        </div>
      </div>

      {/* CSS 애니메이션 */}
      <style>
        {`
          @keyframes cyberGlow {
            0% { opacity: 0.3; }
            100% { opacity: 0.7; }
          }
          
          @keyframes cyber {
            0%, 100% { 
              text-shadow: 0 0 3vw #F40AD5, 0 0 6vw #F40AD5, 0 0 9vw #F40AD5;
            }
            50% { 
              text-shadow: 0 0 1.5vw #F40AD5, 0 0 3vw #F40AD5, 0 0 4.5vw #F40AD5;
            }
          }
          
          @keyframes zone {
            0%, 100% { 
              text-shadow: 0 0 3vw #23F6EF, 0 0 6vw #23F6EF, 0 0 9vw #23F6EF;
            }
            50% { 
              text-shadow: 0 0 1.5vw #23F6EF, 0 0 3vw #23F6EF, 0 0 4.5vw #23F6EF;
            }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default VoiceTestSelection;
