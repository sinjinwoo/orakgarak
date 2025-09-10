import librosa
import numpy as np


# Parameter
# filepath (str): 오디오 파일 경로 (.wav)
# sr (int): 샘플링 레이트 (기본값: 22050)
# n_mels (int): 멜 밴드 수 (기본값: 128)
# n_fft (int): FFT 윈도우 크기
# hop_length (int): 프레임 간 이동 길이

# Returns:
# np.ndarray: [n_mels, time_frames] 형태의 log-mel spectrogram

def extract_mel(filepath, sr=22050, n_mels=128, n_fft=1024, hop_length=512):
    y, _ = librosa.load(filepath, sr=sr, mono=True)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft,
                                               hop_length=hop_length, n_mels=n_mels)
    log_mel = librosa.power_to_db(mel, ref=np.max)
    return log_mel.mean(axis=1)         # 벡터로 변환 해줌 (128,)
