import librosa
import numpy as np
import os

def extract_features(filepath, sr=16000, n_mels=48, n_fft=512, hop_length=256, n_mfcc=5):
    """
    오디오 파일로부터 다양한 음성 피처 추출용

    Parameters:
        filepath (str): 오디오 파일 경로 (.wav)
        sr (int): 샘플링 레이트
        n_mels (int): 멜 밴드 수
        n_fft (int): FFT 윈도우 크기
        hop_length (int): 프레임 간 이동 길이
        n_mfcc (int): 추출할 MFCC 계수 수 -> 5개로 설정

    Returns:
        dict: 추출된 피처들을 담은 딕셔너리
    """
    # 오디오 파일 로드
    y, _ = librosa.load(filepath, sr=sr, mono=True)
    y = librosa.util.normalize(y)

    # 1. Mel Spectrogram
    mel_spectrogram = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, n_mels=n_mels)
    log_mel_spectrogram = librosa.power_to_db(mel_spectrogram, ref=np.max)

    # 2. MFCC
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)

    # 3. Spectral Centroid
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)

    # 4. Spectral Bandwidth
    spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)

    # 5. Spectral Contrast
    spectral_contrast = librosa.feature.spectral_contrast(y=y, sr=sr)

    # 6. Spectral Rolloff
    spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)

    # 피처들을 딕셔너리로 묶어 반환 (시간 축에 대해 평균)
    features = {
        'mel_spectrogram': np.mean(log_mel_spectrogram, axis=1),
        'mfcc': np.mean(mfcc, axis=1),
        'spectral_centroid': np.mean(spectral_centroid),
        'spectral_bandwidth': np.mean(spectral_bandwidth),
        'spectral_contrast': np.mean(spectral_contrast, axis=1),
        'spectral_rolloff': np.mean(spectral_rolloff)
    }
    return features

if __name__ == '__main__':
    # 테스트를 위한 샘플 오디오 파일 경로
    # 이 스크립트(extract_mel.py)는 'scripts' 폴더 안에 있으므로, 'data' 폴더에 접근하기 위해 상위 폴더로 이동해야 합니다.
    sample_audio_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'sample_data.wav')

    # 피처 추출 함수 실행
    extracted_features = extract_features(sample_audio_path)

    # 추출된 피처와 형태(shape) 출력
    print("Extracted Features:\n")
    for feature_name, feature_value in extracted_features.items():
        print(f"- {feature_name}:")
        print(f"  Shape: {feature_value.shape}")
        print(f"  Value: {feature_value}\n") # 값 전체가 궁금할 경우 주석 해제
