import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

def get_recommendations(user_df: pd.DataFrame,
                        all_songs_df: pd.DataFrame,
                        top_n: int = 10,
                        min_popularity: int = 1000,
                        allowed_genres: list = None) -> pd.DataFrame:

    # 사용할 feature 
    feature_cols = [f"mfcc_{i}" for i in range(13)] + ["pitch_low", "pitch_high", "pitch_avg"]

    # 데이터 준비
    X = all_songs_df[feature_cols].values
    song_ids = all_songs_df["song_id"].values
    popularity = all_songs_df["popularity"].values
    user_features = user_df[feature_cols].values

    # 정규화 (MFCC)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    user_scaled = scaler.transform(user_features)

    # 음색 유사도 계산
    sims = cosine_similarity(user_scaled, X_scaled)[0]

    # popularity 필터
    mask_popularity = popularity >= min_popularity

    # 장르 필터 
    if allowed_genres:
        mask_genre = all_songs_df["genre"].apply(
            lambda g: any(ag in str(g) for ag in allowed_genres)
        ).values
    else:
        mask_genre = np.ones(len(all_songs_df), dtype=bool)

    # 후보 곡 추출
    candidate_indices = np.where(mask_popularity & mask_genre)[0]

    if len(candidate_indices) == 0:
        return pd.DataFrame()

    # similarity 높은 순 정렬
    sorted_indices = candidate_indices[np.argsort(sims[candidate_indices])[::-1]]

    # 상위 N개 추출
    top_indices = sorted_indices[:top_n]

    # 결과 DataFrame
    recommendations = pd.DataFrame({
        "song_id": song_ids[top_indices],
        "similarity": sims[top_indices],
        "popularity": popularity[top_indices],
        "pitch_low": all_songs_df["pitch_low"].iloc[top_indices].values,
        "pitch_high": all_songs_df["pitch_high"].iloc[top_indices].values,
        "pitch_avg": all_songs_df["pitch_avg"].iloc[top_indices].values,
        "genre": all_songs_df["genre"].iloc[top_indices].values  # 장르도 포함
    })

    return recommendations


