import librosa
import logging
import numpy as np

def extract_mfcc(mel_spectrogram, sr=16000, n_mfcc=13):
    try:
        mfcc = librosa.feature.mfcc(S=mel_spectrogram, sr=sr, n_mfcc=n_mfcc)
        mfcc_mean = np.mean(mfcc, axis=1)
        return mfcc_mean
    except Exception as e:
        logging.warning(f"[MFCC 추출 실패] 오류: {e}")
        return np.zeros(n_mfcc)