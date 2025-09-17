import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity

def get_recommendations(user_df: pd.DataFrame,
                        all_songs_df: pd.DataFrame,
                        top_n: int = 10,
                        min_popularity: int = 1000,
                        use_pitch_filter: bool = True) -> pd.DataFrame:

    # 데이터 로드
    feature_cols = [f"mfcc_{i}" for i in range(13)] + ["pitch_low", "pitch_high", "pitch_avg"]

    # 데이터 준비
    X = all_songs_df[feature_cols].values
    song_ids = all_songs_df["song_id"].values
    popularity = all_songs_df["popularity"].values
    user_features = user_df[feature_cols].values


    # pitch 정보
    user_pitch_low = user_df["pitch_low"].iloc[0]
    user_pitch_high = user_df["pitch_high"].iloc[0]
    user_pitch_avg = user_df["pitch_avg"].iloc[0]

    # 정규화 (MFCC, pitch)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    user_scaled = scaler.transform(user_features)

    # 음색 유사도 계산
    sims = cosine_similarity(user_scaled, X_scaled)[0]

    # popularity 필터
    mask_popularity = popularity >= min_popularity

    # pitch 조건 필터
    if use_pitch_filter:
        mask_pitch = (
            (all_songs_df["pitch_low"] >= user_pitch_low) &
            (all_songs_df["pitch_high"] <= user_pitch_high) &
            (np.abs(all_songs_df["pitch_avg"] - user_pitch_avg) <= 20)
        )
        final_mask = mask_popularity & mask_pitch
    else:
        final_mask = mask_popularity

    # 후보 곡 추출
    candidate_indices = np.where(final_mask)[0]
    if len(candidate_indices) == 0:
        candidate_indices = np.where(mask_popularity)[0]

    if len(candidate_indices) == 0:
        return pd.DataFrame()

    # 6similarity 높은 순 정렬
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
        "pitch_avg": all_songs_df["pitch_avg"].iloc[top_indices].values
    })

    return recommendations


if __name__ == "__main__":
    # 테스트 실행
    result = get_recommendations(
        all_features_csv="C:/Users/SSAFY/Desktop/output/all_features.csv",
        user_features_csv="C:/Users/SSAFY/Desktop/output/user_features.csv",
        top_n=10
    )
    print(result)
