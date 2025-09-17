import librosa
import numpy as np

# filepath (str): 오디오 파일 경로 (.wav)
# sr (int): 샘플링 레이트 
# n_mels (int): 멜 밴드 수 
# n_fft (int): FFT 윈도우 크기
# hop_length (int): 프레임 간 이동 길이

# np.ndarray: log-mel spectrogram 반환

def extract_mel(filepath, sr=16000, n_mels=48, n_fft=512, hop_length=256):
    y, _ = librosa.load(filepath, sr=sr, mono=True)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, n_fft=n_fft,
                                               hop_length=hop_length, n_mels=n_mels)
    log_mel = librosa.power_to_db(mel, ref=np.max)
    return log_mel
