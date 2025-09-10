# 파일 병렬로 처리해서 저장
import numpy as np
import os
import tqdm
import json
import logging
from multiprocessing import Pool, cpu_count
from extract_features import extract_features

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("process_dataset_parallel.log", encoding="utf-8")
    ]
)

# popularity 정보 로드
def load_popularity_map(popularity_json_path):
    with open(popularity_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return {int(item["song_id"]): item for item in data}

# numpy.ndarray -> list
def convert_numpy_to_list(d):
    converted = {}
    for k, v in d.items():
        if isinstance(v, np.ndarray):
            converted[k] = v.tolist()
        else:
            converted[k] = v
    return converted

# 단일 곡 feature 추출 및 저장
def process_one_song(args):
    song_id, dataset_path, output_path, popularity_map = args

    subdir = str(song_id // 1000)
    mel_path = os.path.join(dataset_path, subdir, f"{song_id}.npy")
    
    output_subdir = os.path.join(output_path, subdir)
    if not os.path.exists(output_subdir):
        os.makedirs(output_subdir, exist_ok=True)
        
    output_filepath = os.path.join(output_subdir, f"{song_id}.json")

    if os.path.exists(output_filepath):
        # logging.info(f"이미 처리된 파일: {output_filepath}, 건너뜀")
        return

    if not os.path.exists(mel_path):
        return

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
        
        # 피처 저장
        with open(output_filepath, "w", encoding="utf-8") as f:
            json.dump(features, f, ensure_ascii=False)

    except Exception:
        logging.exception(f"[Error] {mel_path} 처리 중 오류 발생")

# 병렬 처리 실행
def process_dataset_parallel(dataset_path, output_path, song_ids, popularity_map):
    logging.info("병렬 피처 추출 시작")

    # 디렉토리 생성
    if not os.path.exists(output_path):
        os.makedirs(output_path)
        logging.info(f"'{output_path}' 디렉토리 생성 완료")

    tasks = [(song_id, dataset_path, output_path, popularity_map) for song_id in song_ids]

    with Pool(cpu_count()) as pool:
        list(tqdm.tqdm(pool.imap_unordered(process_one_song, tasks), total=len(tasks), desc="피처 추출 중"))

    logging.info("피처 추출 완료")

# 메인 함수
if __name__ == '__main__':
    MELON_DATASET_PATH = "E:/melondataset/data"
    OUTPUT_FEATURES_PATH = "E:/melondataset/features"  # 피처 저장 경로
    POPULARITY_JSON_PATH = "E:/melondataset/song_popularity.json"
    TOTAL_SONGS = 707989

    logging.info("=" * 50)
    logging.info("음악 데이터셋 피처 추출 시작")
    logging.info(f"데이터셋 경로: {MELON_DATASET_PATH}")
    logging.info(f"저장 경로: {OUTPUT_FEATURES_PATH}")
    logging.info("=" * 50)

    popularity_map = load_popularity_map(POPULARITY_JSON_PATH)
    song_id_range = range(TOTAL_SONGS)

    process_dataset_parallel(MELON_DATASET_PATH, OUTPUT_FEATURES_PATH, song_id_range, popularity_map)

    logging.info("=" * 50)
    logging.info("작업 완료")
    logging.info("=" * 50)
