# main.py

from features.extract_mel import extract_mel
import os, numpy as np

print("내 목소리 분석 중...")
my_mel = extract_mel("my_voice.wav").mean(axis=1)

song_vectors = {f: np.load(os.path.join("melon_data", f)) for f in os.listdir("melon_data") if f.endswith(".npy")}
top_songs = recommend(my_mel, song_vectors)

print(f"\n[내 목소리 특징] F1: {f1:.2f} Hz, F2: {f2:.2f} Hz")
print("\n[추천 곡]")
for name, score in top_songs:
    print(f"  {name.replace('.npy','')}: 유사도 {score:.3f}")
