import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

# 1. 데이터 로드
df = pd.read_csv("E:/melondataset/all_features.csv")

# feature 컬럼 정의
feature_cols = [f"mfcc_{i}" for i in range(13)] + ["pitch_low", "pitch_high", "pitch_avg"]
X = df[feature_cols].values
song_ids = df["song_id"].values
popularity = df["popularity"].values

# 2. 사용자 음성 피처 (예시: 추출한 값)
user_features = np.array([[-110.0, 72.4, 10.7, 13.7, 2.7, 7.7, -1.2, 2.3, -4.7, -1.3, -3.8, 1.7, 0.4,
                           102.0, 313.6, 175.8]])  # shape (1, 16)

# 3. 정규화
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
user_scaled = scaler.transform(user_features)

# 4. 유사도 계산
sims = cosine_similarity(user_scaled, X_scaled)[0]

# 5. 추천 결과 (상위 10곡)
top_n = 10
top_indices = sims.argsort()[::-1][:top_n]

recommendations = pd.DataFrame({
    "song_id": song_ids[top_indices],
    "similarity": sims[top_indices],
    "popularity": popularity[top_indices]
})

print(recommendations)
