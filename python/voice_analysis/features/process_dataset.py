# 파일 하나씩 처리해서 저장
import numpy as np
import os
import tqdm
import json
import pandas as pd
import tqdm
import logging

from multiprocessing import Pool, cpu_count
from extract_features import extract_features

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(), 
        logging.FileHandler("process_dataset.log", encoding="utf-8")
    ]
)

# song_popularity.json 파일 -> 딕셔너리로 반환
def load_popularity_map(popularity_json_path):
    with open(popularity_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return {int(item["song_id"]): item for item in data}

# numpy.ndarray 값 -> list로 변환
def convert_numpy_to_list(d):
    converted = {}
    for k, v in d.items():
        if isinstance(v, np.ndarray):
            converted[k] = v.tolist()
        else:
            converted[k] = v
    return converted

# 각 멜 스펙트로그램에서 feature 추출 후 저장
def process_dataset(dataset_path, output_path, song_ids, popularity_map=None):

    # 디렉토리 생성
    if not os.path.exists(output_path):
        os.makedirs(output_path)
        logging.info(f"'{output_path}' 디렉토리 생성 완료")

    # 진행 상황 표시 -> tqdm
    for song_id in tqdm.tqdm(song_ids, desc="피처 추출 중"):
        # 파일 경로 구성
        subdir = str(song_id // 1000)
        mel_path = os.path.join(dataset_path, subdir, f"{song_id}.npy")
        
        output_subdir = os.path.join(output_path, subdir)
        if not os.path.exists(output_subdir):
            os.makedirs(output_subdir, exist_ok=True) # 동시성 문제 방지용 True
            
        output_filepath = os.path.join(output_subdir, f"{song_id}.json")

        if os.path.exists(mel_path):
            if os.path.exists(output_filepath):
                logging.info(f"이미 처리된 파일: {output_filepath}, 건너뜀")
                continue
            try:
                # 멜 스펙트로그램 로드
                mel_spectrogram = np.load(mel_path)

                features = {
                    "song_id": song_id,
                    **extract_features(mel_spectrogram)
                }
                
                # popularity 정보 추가
                if popularity_map and song_id in popularity_map:
                    pop_info = popularity_map[song_id]
                    features["popularity"] = pop_info.get("popularity", 0)
                
                # numpy -> list 변환
                features = convert_numpy_to_list(features)

                # 피처 저장
                with open(output_filepath, "w", encoding="utf-8") as f: # json 형식
                    json.dump(features, f, ensure_ascii=False)
                
            except Exception as e:
                logging.error("f[Error] {mel_path} 처리 중 오류 발생", exc_info=True)
        else:
            pass


if __name__ == '__main__':
    MELON_DATASET_PATH = "E:/melondataset/data"          # 원본 멜 스펙트로그램 데이터셋 경로
    OUTPUT_FEATURES_PATH = "E:/melondataset/features"    # 피처 저장 경로
    POPULARITY_JSON_PATH = "C:/Users/SSAFY/Desktop/output/song_popularity.json"
    TOTAL_SONGS = 707989   # 처리할 총 곡 수 707989 
    
    logging.info("="*50)
    logging.info("음악 데이터셋 피처 추출 시작")
    logging.info(f"데이터셋 경로 {MELON_DATASET_PATH}")
    logging.info(f"저장 경로: {OUTPUT_FEATURES_PATH}")
    logging.info("="*50)
    
    # popularity 데이터 로드
    popularity_map = load_popularity_map(POPULARITY_JSON_PATH)

    # 전체 데이터셋 처리
    song_id_range = range(TOTAL_SONGS)
    process_dataset(MELON_DATASET_PATH, OUTPUT_FEATURES_PATH, song_id_range, popularity_map)

    logging.info("="*50)
    logging.info("피처 추출 완료.")
    logging.info("="*50)
