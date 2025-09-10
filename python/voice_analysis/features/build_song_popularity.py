import json
import pandas as pd
import numpy as np
import logging
from collections import defaultdict

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(),  # 콘솔 출력
        logging.FileHandler("build_song_popularity.log", encoding="utf-8")  # 로그 파일 저장
    ]
)

# 플리 합치기
def load_all_playlists(file_paths):
    playlists = []
    for path in file_paths:
        with open(path, 'r', encoding='utf-8') as f:
            playlists.extend(json.load(f))
    return playlists

# 정규화 (0~1)
def minmax_norm(series):
    if series.max() == series.min():
        return series * 0
    return (series - series.min()) / (series.max() - series.min())

# 곡 별 popularity 점수 계산
# playlist_count: 곡이 등장한 플리 개수
# like_avg: 곡이 속한 플리 좋아요 수 평균
def build_song_popularity(playlists, alpha=0.7, beta=0.3):
    song_count = defaultdict(int)
    song_like_sum = defaultdict(int)

    for playlist in playlists:
        like_cnt = playlist.get("like_cnt", 0)
        songs = playlist.get("songs", [])
        for song in set(songs):
            song_count[song] += 1
            song_like_sum[song] += like_cnt

    # DataFrame 생성
    songs_data = []
    for song in song_count.keys():
        count = song_count[song]
        avg_like = song_like_sum[song] / count if count > 0 else 0
        log_avg_like = np.log1p(avg_like)

        songs_data.append({
            "song_id": song,
            "playlist_count": count,
            "avg_like": avg_like,
            "log_avg_like": log_avg_like
        })

    df = pd.DataFrame(songs_data)

    df["count_norm"] = minmax_norm(df["playlist_count"])
    df["log_like_norm"] = minmax_norm(df["log_avg_like"])

    # 최종 점수 계산
    df["popularity"] = alpha * df["count_norm"] + beta * df["log_like_norm"]

    # 정렬
    df_sorted = df.sort_values(by="popularity", ascending=False)
    return df_sorted

if __name__ == "__main__":
    file_paths = [
        "E:/melondataset/train.json",
        "E:/melondataset/val.json",
        "E:/melondataset/test.json"
    ]

    all_playlists = load_all_playlists(file_paths)
    logging.info(f"총 {len(all_playlists)} 개의 플레이리스트 로드됨")

    logging.info("곡별 popularity 계산 시작")
    df_sorted = build_song_popularity(all_playlists, alpha=0.7, beta=0.3)

    csv_path = "E:/melondataset/song_popularity.csv"
    json_path = "E:/melondataset/song_popularity.json"

    df_sorted.to_csv(csv_path, index=False, encoding="utf-8-sig")
    df_sorted.to_json(json_path, orient="records", force_ascii=False)

    logging.info("저장 완료")
    logging.info(f"CSV: {csv_path}")
    logging.info(f"JSON: {json_path}")
