import os
import sys
import matplotlib.pyplot as plt

# Add the parent directory to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.extract_mel import extract_mel

# 분석할 오디오 파일 경로 (.wav 권장)
script_dir = os.path.dirname(os.path.abspath(__file__))
audio_path = os.path.join(script_dir, "..", "data", "sample_data.wav")

# 출력 이미지 저장 경로
output_image = os.path.join(script_dir, "mel_output.png")

# 멜 스펙트로그램 추출
logmel = extract_mel(audio_path)

# 시각화 및 저장
plt.figure(figsize=(10, 4))
plt.imshow(logmel, aspect='auto', origin='lower', cmap='magma')
plt.title(f"Mel Spectrogram: {os.path.basename(audio_path)}")
plt.xlabel("Time Frames")
plt.ylabel("Mel Frequency Bands")
plt.colorbar(label="dB")
plt.tight_layout()
plt.savefig(output_image)
print(f"Mel spectrogram image saved to: {output_image}")
