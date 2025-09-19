import librosa
import numpy as np

from pydub import AudioSegment
import os

def convert_to_wav(filepath, target_sr=16000):
    # 파일 확장자
    name, ext = os.path.splitext(filepath)
    ext = ext.lower()

    # 이미 wav면 변환 생략
    if ext == ".wav":
        return filepath

    # 오디오 로드 후 wav로 변환
    sound = AudioSegment.from_file(filepath)
    wav_path = f"{name}.wav"
    sound = sound.set_frame_rate(target_sr).set_channels(1)
    sound.export(wav_path, format="wav")
    return wav_path

# 특징 추출
def extract_features(filepath, sr=16000):
    y, sr = librosa.load(filepath, sr=sr)

    features = {}
    features["mfcc_mean"] = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)[:5])
    features["centroid"] = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    features["rolloff"] = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
    features["bandwidth"] = np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))
    features["zcr"] = np.mean(librosa.feature.zero_crossing_rate(y))

    # 디버깅 출력
    print("[디버깅] 음성 특징값:")
    for k, v in features.items():
        print(f"  {k:12s}: {v:.2f}")

    return features

def classify_tone(f):
    desc = []

    # (1) 톤 해석: Centroid + Rolloff
    if f["centroid"] < 1600 and f["rolloff"] < 3000:
        desc.append("낮고 부드러운 톤")
    elif f["centroid"] > 2000 and f["rolloff"] > 4200:
        desc.append("밝고 날카로운 톤")
    else:
        desc.append("편안하고 균형 잡힌 톤")

    # (2) 분위기/음색 해석: Bandwidth + ZCR
    if f["bandwidth"] > 2200 and f["zcr"] > 0.11:
        desc.append("풍부하고 경쾌한 음색")
    elif f["bandwidth"] < 1700 and f["zcr"] < 0.07:
        desc.append("가늘고 차분한 목소리")
    else:
        desc.append("자연스럽고 듣기 편안한 목소리")

    # (3) 전체적인 무게감: MFCC
    if f["mfcc_mean"] < -20:
        desc.append("부드러운 음색")
    elif f["mfcc_mean"] < 0:
        desc.append("개성 있는 음색")
    else:
        desc.append("힘 있는 음색")

    return desc

# 한 줄 문장 출력
def generate_sentence(desc):
    # 결과를 한 문장으로 자연스럽게 연결
    return f"당신의 목소리는 {desc[0]}, {desc[1]}, 그리고 {desc[2]}입니다."

# 전체 실행
def analyze_voice(filepath):
    wav_file = convert_to_wav(filepath)
    features = extract_features(wav_file)
    desc = classify_tone(features)
    summary = generate_sentence(desc)
    return summary

# 사용 예시
if __name__ == "__main__":
    #filepath = "C:/min/special_pj/data/artvit.m4a"  # 사용자 음성 파일
    #filepath = "C:/min/special_pj/data/winter_things.mp3"
    filepath = "C:/min/special_pj/data/26.m4a"
    #filepath = "C:/min/special_pj/data/leemugin.mp3"
    #filepath = "C:/min/special_pj/data/marktub.mp3"
    #filepath = "C:/min/special_pj/data/golden2.mp3"
    #filepath = "C:/min/special_pj/data/내안의그대.mp3"
    #filepath = "C:/min/special_pj/data/garden.mp3"  # 사용자 음성 파일
    #filepath = "C:/min/special_pj/data/lucky.mp3"  # 사용자 음성 파일
    #filepath = "C:/min/special_pj/data/sample_data.wav"  # 사용자 음성 파일
    #filepath = "C:/min/special_pj/data/artvit_2.m4a"  # 사용자 음성 파일

    result = analyze_voice(filepath)  # or "male"/"female"
    print(result)
