import os
import sys
import numpy as np
import pandas as pd
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from features.extract_mel import extract_mel
from .extract_mfcc import extract_mfcc

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# 유저 오디오 + pitch 입력 받아 DataFrame 생성
def process_user_audio(audio_path, pitch_low, pitch_high, pitch_avg, output_csv="C:/Users/SSAFY/Desktop/output/user_features.csv"):
    mel = extract_mel(audio_path)
    if mel is None:
        logging.error("Mel-spectrogram 추출 실패")
        return None

    mfcc_mean = extract_mfcc(mel)

    # CSV 형식 
    feature_dict = {
        "song_id": ["user_audio"],
    }
    for i, val in enumerate(mfcc_mean):
        feature_dict[f"mfcc_{i}"] = [val]

    feature_dict["pitch_low"] = [pitch_low]
    feature_dict["pitch_high"] = [pitch_high]
    feature_dict["pitch_avg"] = [pitch_avg]
    feature_dict["popularity"] = [0.0]  # 유저 오디오는 popularity 없음

    df = pd.DataFrame(feature_dict)
    df.to_csv(output_csv, index=False)

    logging.info(f"User feature 저장 완료: {output_csv}")
    return df


if __name__ == "__main__":
    sample_audio = "C:/min/special_pj/data/26.wav"  # 테스트용
    # pitch 값은 유저 입력으로 전달해야 됨
    result_df = process_user_audio(sample_audio, pitch_low=100.0, pitch_high=320.0, pitch_avg=180.0)
    print(result_df)
