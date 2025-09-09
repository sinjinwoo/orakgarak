import librosa
import numpy as np
import os
from extract_mel import extract_mel

# 추출된 Log-Mel Spectrogram으로부터 피처 추출
def extract_features(mel_spectrogram, sr=16000, n_mfcc=5):
    # 1. MFCC 
    mfcc = librosa.feature.mfcc(S=mel_spectrogram, sr=sr, n_mfcc=n_mfcc)

    try:
        S = librosa.db_to_power(mel_spectrogram)
        y = librosa.feature.inverse.mel_to_audio(S, sr=sr)  # audio 복원 (Log-mel -> power-mel)

        # 2. Spectral Centroid -> 소리의 밝기 수치로 표현
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

        # 3. Spectral Bandwidth -> 소리의 다양성, 풍부함, 다채로움 정도 판단
        spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)

        # 4. Spectral Contrast -> 에너지 강약 대비 계산하여 뚜렷 vs 부드러움 판단
        spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr) 

        # 5. Spectral Rolloff -> 에너지 저주파/고주파 위주인지 판단용
        spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr) # 기본으로 roll_percent = 0.85임

    except Exception as e:
        print(f"[Warning] 멜스펙트로그램에서 오디오 복원 실패: {e}")
        spectral_centroid = spectral_bandwidth = spectral_contrast = spectral_rolloff = np.array([[0]])

    # 피처들 딕셔너리로 리턴 (시간 축에 대해 평균 구해줬음)
    features = {
        'mel_spectrogram': np.mean(mel_spectrogram, axis=1),
        'mfcc': np.mean(mfcc, axis=1),
        'spectral_centroid': np.mean(spectral_centroid),
        'spectral_bandwidth': np.mean(spectral_bandwidth),
        'spectral_contrast': np.mean(spectral_contrast, axis=1),
        'spectral_rolloff': np.mean(spectral_rolloff)
    }
    return features


if __name__ == '__main__':
    # 테스트용 샘플 오디오 파일 경로
    sample_audio_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_data.wav')

    # 멜 스펙트로그램 추출
    mel = extract_mel(sample_audio_path)
    if mel is None:
        exit(1)

    # 피처 추출 
    extracted_features = extract_features(mel)

    # 추출된 피처와 형태 출력
    print("Extracted Features:\n")
    for feature_name, feature_value in extracted_features.items():
        print(f"- {feature_name}:")
        print(f"  Shape: {feature_value.shape}")
        print(f"  Value: {feature_value}\n") 
