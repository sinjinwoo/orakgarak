import pandas as pd
import json
import os
import subprocess
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# 캐시 파일
CACHE_FILE = "C:/Users/SSAFY/Desktop/output/youtube_cache.json"

# 캐시 불러오기
if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, "r", encoding="utf-8") as f:
        cache = json.load(f)
else:
    cache = {}

def clean_song_artist(text: str) -> str:
    if not isinstance(text, str):
        return text
    # (Feat.), (Prod.) 같은 괄호 전부 제거
    return re.sub(r"\([^)]*\)", "", text).strip()

def get_tj_karaoke_views(song_name: str, artist_name: str):
    key = f"{artist_name}|{song_name}"
    if key in cache:
        return key, cache[key]

    song_name = clean_song_artist(song_name)
    artist_name = clean_song_artist(artist_name)

    query = f"{artist_name} {song_name} 노래방"
    cmd = ["yt-dlp", "ytsearch1:" + query, "--dump-json"]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8-sig")
        if not result.stdout.strip():
            cache[key] = 0
            return key, 0

        data = json.loads(result.stdout.splitlines()[0])
        title = data.get("title", "")
        channel = data.get("channel", "")
        views = data.get("view_count", 0)

        # 채널명으로 필터링
        valid_channels = [
            "TJ Karaoke Official Youtube Channel",
            "금영 노래방 공식 유튜브 채널"
        ]

        if channel.strip() in valid_channels:
            cache[key] = views
        else:
            views = 0
            cache[key] = views

        return key, views

    except Exception as e:
        print(f"[ERROR] {artist_name} - {song_name} 조회 실패: {e}")
        cache[key] = 0
        return key, 0


if __name__ == "__main__":
    input_csv = "C:/Users/SSAFY/Desktop/output/song_meta_with_popularity.csv"
    output_csv = "C:/Users/SSAFY/Desktop/output/song_meta_with_popularity_view.csv"

    df = pd.read_csv(input_csv, encoding="utf-8-sig")

    tasks = list(zip(df["song_name"], df["artist_names"]))
    results = {}

    max_workers = 16
    with ThreadPoolExecutor(max_workers=16) as executor: # 병렬 스레드
        futures = [executor.submit(get_tj_karaoke_views, song, artist) for song, artist in tasks]
        for i, future in enumerate(tqdm(as_completed(futures), total=len(futures), desc="조회수 수집 중")):
            key, views = future.result()
            results[key] = views

            # 100곡마다 중간 저장
            if (i + 1) % 100 == 0:
                df["popularity"] = [
                    results.get(f"{row['artist_names']}|{row['song_name']}", cache.get(f"{row['artist_names']}|{row['song_name']}", 0))
                    for _, row in df.iterrows()
                ]
                df.to_csv(output_csv, index=False, encoding="utf-8-sig")
                print(f"[중간 저장] {i+1}곡 완료 : {output_csv}")

                cache.update(results)
                with open(CACHE_FILE, "w", encoding="utf-8") as f:
                    json.dump(cache, f, ensure_ascii=False, indent=2)

    # 최종 결과 병합
    df["popularity"] = [
        results.get(f"{row['artist_names']}|{row['song_name']}", cache.get(f"{row['artist_names']}|{row['song_name']}", 0))
        for _, row in df.iterrows()
    ]

    # 최종 저장
    df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"[최종 저장 완료] : {output_csv}")
