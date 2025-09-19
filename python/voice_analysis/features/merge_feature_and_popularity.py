import pandas as pd

# 두 CSV 불러오기
meta = pd.read_csv("C:/Users/SSAFY/Desktop/output/song_meta_with_popularity_view.csv")
features = pd.read_csv("C:/Users/SSAFY/Desktop/output/all_features.csv")

# song_id 기준으로 popularity 매칭
popularity_map = meta[["song_id", "popularity"]]

# 기존 popularity 제거 후 새 popularity로 병합
features = features.drop(columns=["popularity"], errors="ignore")
features = features.merge(popularity_map, on="song_id", how="left")

# 매칭되지 않은 값은 0으로 채우기
features["popularity"] = features["popularity"].fillna(0).astype(int)

# 원본 파일에 덮어쓰기 저장
features.to_csv("C:/Users/SSAFY/Desktop/output/all_features_updated.csv", index=False)

print("업데이트 완료")
