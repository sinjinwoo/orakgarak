import librosa
import numpy as np
from pydub import AudioSegment
import noisereduce as nr
import os


# mp3 -> wav 변환
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


# 전처리
def preprocess_audio(filepath, sr=16000):
    y, sr = librosa.load(filepath, sr=sr, mono=True)

    # 무음 제거 
    y, _ = librosa.effects.trim(y, top_db=25) 
    # 노이즈 제거
    reduced = nr.reduce_noise(y=y, sr=sr)

    return reduced, sr

# 특징 추출
def extract_features(filepath, sr=16000):
    y, sr = preprocess_audio(filepath, sr=sr)
    #y, sr = librosa.load(filepath, sr=sr)

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    mfcc_mean = np.mean(mfcc[:5])              
    mfcc_var = np.mean(np.var(mfcc, axis=1))   

    features = {
        "mfcc_mean": mfcc_mean,
        "mfcc_var": mfcc_var,
        "centroid": np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)),
        "rolloff": np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)),
        "bandwidth": np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr)),
        "zcr": np.mean(librosa.feature.zero_crossing_rate(y)),
    }

    # 디버깅 출력
    print("[디버깅] 음성 특징값:")
    for k, v in features.items():
        print(f"  {k:12s}: {v:.2f}")

    return features

# 조건 조합 기반 종합 해석
def classify_tone(f):
    desc = []

    c = f["centroid"]
    r = f["rolloff"]
    b = f["bandwidth"]
    z = f["zcr"]
    m_mean = f["mfcc_mean"]
    m_var = f["mfcc_var"]

    # 톤
    if c > 2100 and r > 3500:
        if z > 0.22:
            desc.append("선명하고 강렬한 톤")
        else:
            desc.append("밝고 또렷한 톤")
    elif c > 2100 and 2800 <= r <= 3500:
        if z > 0.21:
            desc.append("가볍고 높은 톤")
        else:
            desc.append("부드럽고 맑은 톤")
    elif c < 1600 and r < 2800:
        if z > 0.16:
            desc.append("무게감 있는 톤")
        else:
            desc.append("차분하고 포근한 톤")
    elif 1600 <= c < 1800:  
        if r > 3000 and z > 0.16:
            desc.append("안정적이고 힘 있는 중음 톤")
        else:
            desc.append("따뜻하고 차분한 중음 톤")

    elif 1800 <= c <= 2100: 
        if r > 3000 and z > 0.16:
            desc.append("밝고 힘 있는 중음 톤")
        else:
            desc.append("맑고 선명한 중음 톤")

    else:
        desc.append("편안한 톤")

    # 음색 (bandwidth + mfcc_var)
    if b > 1500:
        if m_var > 2200:
            desc.append("울림이 큰 다채로운 음색")
        else:
            desc.append("울림이 큰 안정적인 음색")
    elif 1200 <= b <= 1500:
        if m_var > 2200:
            desc.append("편안하고 매력적인 음색")
        else:
            desc.append("자연스럽고 편안한 음색")
    elif b < 1200:
        if m_var > 1800:
            desc.append("편안하고 개성 있는 음색")
        else:
            desc.append("담담하고 안정적인 음색")
    else:
        desc.append("담백한 음색")

    # 분위기 (mfcc_mean)
    low_tone = (c < 1600 and r < 2800 and z < 0.15)
    # 고음 지표
    high_tone = (c > 2100 and r > 3500 and z > 0.2)

    if m_mean <= -85:
        if m_var < 2000:
            desc.append("차분하고 따뜻한 분위기")
        else:
            desc.append("묵직하고 드라마틱한 분위기")

    elif -85 < m_mean <= -72:
        if m_var < 2000:
            desc.append("잔잔하고 안정적인 분위기")
        else:
            desc.append("서정적이고 감성적인 분위기")

    else:  # mfcc_mean > -72 → 고음 비중
        if high_tone:
            desc.append("강렬하고 에너지 넘치는 분위기")
        elif low_tone:
            desc.append("부드럽고 차분한 분위기")
        else:
            if m_var > 2500:
                desc.append("밝고 힘 있는 분위기")
            else:
                desc.append("맑고 산뜻한 분위기")

    return desc

def generate_sentence(desc):
    tone = None
    timbre = None
    mood = None

    # 키워드 구분
    for d in desc:
        if "톤" in d:
            tone = d
        elif "음색" in d:
            timbre = d
        elif "분위기" in d:
            mood = d

    # 문장 생성
    return f'당신의 목소리는 {tone}에 {timbre}을 가졌고, {mood}가 어울립니다!'

# 전체 실행
def analyze_voice(filepath):
    wav_file = convert_to_wav(filepath)
    features = extract_features(wav_file)
    desc = classify_tone(features)
    summary = generate_sentence(desc)
    return summary


# 테스트
if __name__ == "__main__":
    #filepath = "C:/min/special_pj/data/artvit.m4a"  # 사용자 음성 파일
    #filepath = "C:/min/special_pj/data/winter_things.mp3"
    #filepath = "C:/min/special_pj/data/26.m4a"
    
    #filepath = "C:/min/special_pj/data/leemugin.mp3"
    #filepath = "C:/min/special_pj/data/marktub.mp3"
    #filepath = "C:/min/special_pj/data/golden2.mp3"
    #filepath = "C:/min/special_pj/data/yerin.mp3"
    #filepath = "C:/min/special_pj/data/sohee.mp3"

    #filepath = "C:/min/special_pj/data/winter.mp3"
    #filepath = "C:/min/special_pj/data/bumsu.mp3"
    #filepath = "C:/min/special_pj/data/1000.mp3"
    #filepath = "C:/min/special_pj/data/내안의그대.mp3"
    #filepath = "C:/min/special_pj/data/garden.mp3"  
    #filepath = "C:/min/special_pj/data/lucky.mp3"  
    filepath = "C:/min/special_pj/data/sample_data.wav"  
    #filepath = "C:/min/special_pj/data/artvit_2.m4a"  
    #filepath = "C:/min/special_pj/data/test_voice_1.m4a" 
    #filepath = "C:/min/special_pj/data/test_voice_2.m4a"
    #filepath = "C:/min/special_pj/data/test_voice_3.m4a"
    #filepath = "C:/min/special_pj/data/woo.m4a" 
    
    #filepath = "C:/min/special_pj/data/wookyung.m4a" 
    #filepath = "C:/min/special_pj/data/bum.m4a" 
    #filepath = "C:/min/special_pj/data/sungjae.m4a"

    result = analyze_voice(filepath)
    print(result)
