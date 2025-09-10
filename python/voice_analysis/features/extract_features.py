import librosa
import numpy as np
import os
import logging
from extract_mel import extract_mel

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# 멜스펙트로그램으로부터 피처 추출 (MFCC 계수: 13개 지정)
def extract_features(mel_spectrogram, song_id=None, sr=16000, n_mfcc=13):
    try:
        # MFCC 추출
        mfcc = librosa.feature.mfcc(S=mel_spectrogram, sr=sr, n_mfcc=n_mfcc)
        mfcc_mean = np.mean(mfcc, axis=1)

        # mel -> Hz 변환
        n_mels = mel_spectrogram.shape[0]
        mel_freqs = librosa.mel_frequencies(n_mels=n_mels, fmin=80, fmax=1200)

        # 프레임별 dominant 주파수 추출
        max_bin_indices = np.argmax(mel_spectrogram, axis=0)
        max_freqs = mel_freqs[max_bin_indices]

        # 사람 목소리 범위 기준으로 필터링 (80 ~ 1200Hz)
        valid_freqs = max_freqs[(max_freqs >= 80) & (max_freqs <= 1200)]

        if len(valid_freqs) == 0:
            low_freq = high_freq = avg_freq = 0.0
        else:
            low_freq = np.min(valid_freqs)
            high_freq = np.max(valid_freqs)
            avg_freq = np.mean(valid_freqs)

        features = {
            'mfcc': mfcc_mean,
            'pitch_low': float(low_freq),
            'pitch_high': float(high_freq),
            'pitch_avg': float(avg_freq)
        }

    except Exception as e:
        logging.warning(f"[MFCC 추출 실패] song_id={song_id} / 오류: {e}")
        features = {
            'mfcc': np.zeros(n_mfcc),
            'pitch_low': 0.0,
            'pitch_high': 0.0,
            'pitch_avg': 0.0
        }

    return features


if __name__ == '__main__':
    sample_audio_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_data.wav')  # 테스트용

    mel = extract_mel(sample_audio_path)
    
    if mel is None:
        exit(1)

    # 피처 추출 
    extracted_features = extract_features(mel)

    logging.info("Extracted Features:")
    for feature_name, feature_value in extracted_features.items():
        logging.info(f"- {feature_name}: shape={feature_value.shape}, value={feature_value}")
