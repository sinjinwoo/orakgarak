import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

# 데이터 로드
df = pd.read_csv("C:/Users/SSAFY/Desktop/output/all_features.csv")

feature_cols = [f"mfcc_{i}" for i in range(13)] + ["pitch_low", "pitch_high", "pitch_avg"]
X = df[feature_cols].values
song_ids = df["song_id"].values
popularity = df["popularity"].values

# 사용자 음성 피처
user_df = pd.read_csv("C:/Users/SSAFY/Desktop/output/user_features.csv")
user_features = user_df[feature_cols].values

# pitch 정보
user_pitch_low = user_df["pitch_low"].iloc[0]
user_pitch_high = user_df["pitch_high"].iloc[0]
user_pitch_avg = user_df["pitch_avg"].iloc[0]

# 1. 정규화 (MFCC)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
user_scaled = scaler.transform(user_features)

# 2. 음색 유사도 계산
sims = cosine_similarity(user_scaled, X_scaled)[0]

# 3. popularity 기준 필터 (0.1 이상만)
mask_popularity = popularity >= 0.1

# 4. pitch 조건 필터 (선택사항)
mask_pitch = (
    (df["pitch_low"] >= user_pitch_low) &
    (df["pitch_high"] <= user_pitch_high) &
    (np.abs(df["pitch_avg"] - user_pitch_avg) <= 20)
)

# → pitch 조건까지 반영하려면 mask_popularity & mask_pitch
final_mask = mask_popularity & mask_pitch

# 5. 후보 곡 추출
candidate_indices = np.where(final_mask)[0]

# 후보가 없을 경우 fallback (popularity 조건만 적용)
if len(candidate_indices) == 0:
    candidate_indices = np.where(mask_popularity)[0]

# 6. 후보 중에서 similarity 높은 순 정렬
sorted_indices = candidate_indices[np.argsort(sims[candidate_indices])[::-1]]

# 7. 상위 N개 추출
top_n = 10
top_indices = sorted_indices[:top_n]

recommendations = pd.DataFrame({
    "song_id": song_ids[top_indices],
    "similarity": sims[top_indices],
    "popularity": popularity[top_indices],
    "pitch_low": df["pitch_low"].iloc[top_indices].values,
    "pitch_high": df["pitch_high"].iloc[top_indices].values,
    "pitch_avg": df["pitch_avg"].iloc[top_indices].values
})

print(recommendations)
