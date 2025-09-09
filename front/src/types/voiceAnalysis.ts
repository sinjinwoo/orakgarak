// 음성 분석 관련 타입 정의
export interface VoiceAnalysis {
  vocalRange: {
    min: number; // Hz
    max: number; // Hz
    comfortable: {
      min: number;
      max: number;
    };
  };
  vocalCharacteristics: {
    pitchVariation: number; // 0-100, 음높이 변화 정도
    vibrato: number; // 0-100, 비브라토 정도
    breathiness: number; // 0-100, 숨소리 정도
    brightness: number; // 0-100, 음색 밝기
  };
  confidence: number; // 0-100, 분석 신뢰도
}

export interface VoiceTestStep {
  id: string;
  title: string;
  description: string;
  instruction: string;
  targetNote?: number; // Hz
  duration: number; // 초
  type: 'range' | 'sustain' | 'melody' | 'characteristics';
}

export interface VoiceTestResult {
  stepId: string;
  score: number; // 0-100
  data: {
    frequency?: number;
    stability?: number;
    accuracy?: number;
    characteristics?: {
      pitchVariation: number;
      vibrato: number;
      breathiness: number;
      brightness: number;
    };
  };
  timestamp: number;
}

export interface VoiceTestSession {
  id: string;
  startTime: number;
  endTime?: number;
  currentStep: number;
  results: VoiceTestResult[];
  isCompleted: boolean;
  overallScore: number;
}
