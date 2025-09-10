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

        # 주파수 기반 음역대 추정
        energy_per_bin = mel_spectrogram.mean(axis=1) 
        mel_freqs = librosa.mel_frequencies(
            n_mels=mel_spectrogram.shape[0],
            fmin=0,
            fmax=sr/2
        )

        # 주요 음역대 10% ~ 90%
        q10_idx = int(np.quantile(np.arange(len(energy_per_bin)), 0.1))
        q90_idx = int(np.quantile(np.arange(len(energy_per_bin)), 0.9))
        low_freq = mel_freqs[q10_idx] # 주요 음역대의 하한
        high_freq = mel_freqs[q90_idx] # 주요 음역대 상한

        features = {
            'mfcc': mfcc_mean,
            'pitch_low': float(low_freq),
            'pitch_high': float(high_freq)
        }
    except Exception as e:
        logging.warning(f"MFCC 추출 실패: {e} -> song_id: {song_id}")
        features = {
            'mfcc': np.zeros(n_mfcc)
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
