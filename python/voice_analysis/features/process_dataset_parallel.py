# 파일 병렬로 처리해서 저장
import numpy as np
import os
import tqdm
import json
import pandas as pd
import logging
from multiprocessing import Pool, cpu_count
from extract_features import extract_features

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("process_dataset.log", encoding="utf-8")
    ]
)

# popularity 정보 로드
def load_popularity_map(popularity_json_path):
    with open(popularity_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return {int(item["song_id"]): item for item in data}

# numpy.ndarray 값을 list로 변환
def convert_numpy_to_list(d):
    converted = {}
    for k, v in d.items():
        if isinstance(v, np.ndarray):
            converted[k] = v.tolist()
        else:
            converted[k] = v
    return converted

# 병렬 처리할 단일 곡 feature 추출 함수
def process_one_song(args):
    song_id, dataset_path, popularity_map = args

    subdir = str(song_id // 1000)
    mel_path = os.path.join(dataset_path, subdir, f"{song_id}.npy")

    if not os.path.exists(mel_path):
        return None  # 해당 곡이 존재하지 않음

    try:
        mel_spectrogram = np.load(mel_path)
        features = {
            "song_id": song_id,
            **extract_features(mel_spectrogram, song_id)
        }

        # popularity 추가
        if popularity_map and song_id in popularity_map:
            features["popularity"] = popularity_map[song_id].get("popularity", 0)
        else:
            features["popularity"] = 0

        features = convert_numpy_to_list(features)
        return features

    except Exception:
        logging.exception(f"[Error] {mel_path} 처리 중 오류 발생")
        return None

# 병렬 처리 실행 및 CSV 저장
def process_dataset_parallel_to_csv(dataset_path, output_csv_path, song_ids, popularity_map):
    logging.info("병렬 피처 추출 시작")

    tasks = [(song_id, dataset_path, popularity_map) for song_id in song_ids]
    results = []

    with Pool(cpu_count()) as pool:
        for result in tqdm.tqdm(pool.imap_unordered(process_one_song, tasks), total=len(tasks)):
            if result is not None:
                results.append(result)

    logging.info("피처 추출 완료")

    # pandas DataFrame으로 저장
    df = pd.DataFrame(results)
    df.to_csv(output_csv_path, index=False, encoding='utf-8-sig')

    logging.info(f"[*] 총 {len(df)}개 곡 피처 추출 완료 → {output_csv_path}")

# 메인 함수
if __name__ == '__main__':
    MELON_DATASET_PATH = "E:/melondataset/data"  # 멜 스펙트로그램 경로
    OUTPUT_FEATURES_CSV = "E:/melondataset/all_features.csv"  # 저장 파일
    POPULARITY_JSON_PATH = "E:/melondataset/song_popularity.json"
    TOTAL_SONGS = 707989  # 707989

    logging.info("=" * 50)
    logging.info("음악 데이터셋 피처 추출 시작")
    logging.info(f"데이터셋 경로: {MELON_DATASET_PATH}")
    logging.info(f"출력 파일: {OUTPUT_FEATURES_CSV}")
    logging.info("=" * 50)

    popularity_map = load_popularity_map(POPULARITY_JSON_PATH)
    song_id_range = range(TOTAL_SONGS)

    process_dataset_parallel_to_csv(MELON_DATASET_PATH, OUTPUT_FEATURES_CSV, song_id_range, popularity_map)

    logging.info("=" * 50)
    logging.info("전체 작업 완료")
    logging.info("=" * 50)
