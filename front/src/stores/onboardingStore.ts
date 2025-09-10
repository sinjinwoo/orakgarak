import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingData {
  // 설문 데이터
  gender?: 'male' | 'female' | 'other';
  preferredGenres: string[];
  favoriteSongs: string[];
  
  // 음역대 측정 데이터
  vocalRange?: {
    min: number; // Hz
    max: number; // Hz
  };
  
  // 음색 분석 데이터
  voiceAnalysis?: {
    tone: 'bright' | 'warm' | 'neutral';
    clarity: number; // 0-100
    stability: number; // 0-100
  };
  
  // 온보딩 완료 상태
  isCompleted: boolean;
  currentStep: 'survey' | 'range' | 'analysis' | 'completed';
}

interface OnboardingStore extends OnboardingData {
  // 설문 관련
  setGender: (gender: OnboardingData['gender']) => void;
  setPreferredGenres: (genres: string[]) => void;
  setFavoriteSongs: (songs: string[]) => void;
  
  // 음역대 측정 관련
  setVocalRange: (range: OnboardingData['vocalRange']) => void;
  
  // 음색 분석 관련
  setVoiceAnalysis: (analysis: OnboardingData['voiceAnalysis']) => void;
  
  // 온보딩 진행 관련
  setCurrentStep: (step: OnboardingData['currentStep']) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const initialData: OnboardingData = {
  preferredGenres: [],
  favoriteSongs: [],
  isCompleted: false,
  currentStep: 'survey',
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialData,
      
      setGender: (gender) => set({ gender }),
      
      setPreferredGenres: (preferredGenres) => set({ preferredGenres }),
      
      setFavoriteSongs: (favoriteSongs) => set({ favoriteSongs }),
      
      setVocalRange: (vocalRange) => set({ vocalRange }),
      
      setVoiceAnalysis: (voiceAnalysis) => set({ voiceAnalysis }),
      
      setCurrentStep: (currentStep) => set({ currentStep }),
      
      completeOnboarding: () => set({ 
        isCompleted: true, 
        currentStep: 'completed' 
      }),
      
      resetOnboarding: () => set(initialData),
    }),
    {
      name: 'onboarding-storage',
    }
  )
);
