import os
import sys
import numpy as np
import matplotlib.pyplot as plt

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from features.extract_mel import extract_mel

# 분석할 오디오 파일 경로
script_dir = os.path.dirname(os.path.abspath(__file__))
audio_path = os.path.join(script_dir, "..", "data", "sample_data.wav")

# 이미지 저장 경로
output_image = os.path.join(script_dir, "mel_output.png")

# 멜 스펙트로그램 추출
logmel = extract_mel(audio_path)

# 시간 축 생성 (단위: sec)
sr = 16000
hop_length = 256
duration = logmel.shape[1] * hop_length / sr
time_axis = np.linspace(0, duration, logmel.shape[1])

# 주파수 축 생성 (단위: Hz)
mel_bins = logmel.shape[0]
freq_axis = np.linspace(0, sr // 2 + 1, 512, mel_bins)

# 시각화 및 저장
plt.figure(figsize=(10, 4))
plt.imshow(logmel, aspect='auto', origin='lower', cmap='viridis',   # magma
           extent=[time_axis[0], time_axis[-1], freq_axis[0], freq_axis[-1]]) 
plt.title(f"Mel Spectrogram: {os.path.basename(audio_path)}")
plt.xlabel("Time (s)")
plt.ylabel("Mel Frequency (Hz)")
plt.colorbar(label="dB")
plt.tight_layout()
plt.savefig(output_image)
print(f"Mel spectrogram image saved to: {output_image}")
