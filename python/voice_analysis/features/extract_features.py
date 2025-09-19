import librosa
import numpy as np
import os
import logging
from .extract_mel import extract_mel

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

        # 주파수 추출
        n_mels = mel_spectrogram.shape[0]
        mel_freqs = librosa.mel_frequencies(n_mels=n_mels, fmin=80, fmax=1200)

        # log -> power로 변환
        power = librosa.db_to_power(mel_spectrogram)

        # 프레임별 주파수 가중 평균 계산
        weighted_freqs = np.sum(power.T * mel_freqs, axis=1) / np.sum(power, axis=0)

        # 유효 주파수 필터링
        valid_freqs = weighted_freqs[(weighted_freqs >= 80) & (weighted_freqs <= 1200)]

        if len(valid_freqs) == 0:
            low_freq = high_freq = avg_freq = 0.0
        else:
            low_freq = float(np.percentile(valid_freqs, 5))   # 하위 5% (저음)
            high_freq = float(np.percentile(valid_freqs, 95)) # 상위 5% (고음)
            avg_freq = float(np.mean(weighted_freqs))

        features = {
            'mfcc': mfcc_mean,
            'pitch_low': low_freq,
            'pitch_high': high_freq,
            'pitch_avg': avg_freq
        }


    except Exception as e:
        logging.warning(f"[Feature 추출 실패] song_id={song_id} / 오류: {e}")
        features = {
            'mfcc': np.zeros(n_mfcc),
            'pitch_low': 0.0,
            'pitch_high': 0.0,
            'pitch_avg': 0.0
        }

    return features


if __name__ == '__main__':
    # sample_audio_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_data.wav')  # 테스트용
    sample_audio_path = "C:/min/special_pj/data/sample_data.wav" 
    mel = extract_mel(sample_audio_path)
    
    if mel is None:
        exit(1)

    # 피처 추출 
    extracted_features = extract_features(mel)

    logging.info("Extracted Features:")
    for feature_name, feature_value in extracted_features.items():
        logging.info(f"- {feature_name}: , value={feature_value}")
