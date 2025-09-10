export interface Recording {
  id: string;
  userId: string;
  songId: string;
  song: {
    title: string;
    artist: string;
  };
  audioUrl: string;
  duration: number; // 초 단위
  createdAt: string;
  analysis?: RecordingAnalysis;
}

export interface RecordingAnalysis {
  pitchAccuracy: number; // 0-100
  tempoAccuracy: number; // 0-100
  vocalRange: {
    min: number; // Hz
    max: number; // Hz
  };
  toneAnalysis: {
    brightness: number; // 0-100
    warmth: number; // 0-100
    clarity: number; // 0-100
  };
  overallScore: number; // 0-100
  feedback: string[];
}
