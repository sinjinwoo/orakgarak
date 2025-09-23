import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import os
import sys

# Pinecone 추천 시스템 import
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

try:
    from vector_db import PineconeRecommender
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

def get_recommendations_pinecone(user_df: pd.DataFrame,
                               top_n: int = 10,
                               min_popularity: int = 1000,
                               use_pitch_filter: bool = True,
                               allowed_genres: list = None) -> pd.DataFrame:
    """Pinecone 기반 추천 (새로운 방식)"""

    if not PINECONE_AVAILABLE:
        print("Pinecone이 설치되지 않았습니다. CSV 방식으로 실행합니다.")
        return pd.DataFrame()

    try:
        recommender = PineconeRecommender()
        if not recommender.connect():
            print("Pinecone 연결 실패. CSV 방식으로 실행합니다.")
            return pd.DataFrame()

        return recommender.get_recommendations_by_user_df(
            user_df=user_df,
            top_n=top_n,
            min_popularity=min_popularity,
            use_pitch_filter=use_pitch_filter,
            allowed_genres=allowed_genres
        )
    except Exception as e:
        print(f"Pinecone 추천 오류: {e}")
        return pd.DataFrame()


def get_recommendations(user_df: pd.DataFrame,
                        all_songs_df: pd.DataFrame = None,
                        top_n: int = 10,
                        min_popularity: int = 1000,
                        allowed_genres: list = None,
                        use_pitch_filter: bool = True,
                        disliked_song_ids: list = None,
                        penalty_factor: float = 0.1,
                        use_pinecone: bool = True) -> pd.DataFrame:

    # Pinecone 방식 시도
    if use_pinecone and PINECONE_AVAILABLE:
        try:
            pinecone_result = get_recommendations_pinecone(
                user_df=user_df,
                top_n=top_n,
                min_popularity=min_popularity,
                use_pitch_filter=use_pitch_filter,
                allowed_genres=allowed_genres
            )
            if not pinecone_result.empty:
                print("Pinecone 추천 성공")
                return pinecone_result
            else:
                print("Pinecone 추천 결과 없음, CSV 방식으로 전환")
        except Exception as e:
            print(f"Pinecone 추천 오류: {e}, CSV 방식으로 전환")

    # CSV 방식 (기존 로직)
    if all_songs_df is None:
        print("all_songs_df가 제공되지 않았습니다.")
        return pd.DataFrame()

    print("CSV 기반 추천 실행")

    # 사용할 feature 
    feature_cols = [f"mfcc_{i}" for i in range(13)] + ["pitch_low", "pitch_high", "pitch_avg"]

    # 데이터 준비
    X = all_songs_df[feature_cols].values
    song_ids = all_songs_df["song_id"].values
    popularity = all_songs_df["popularity"].values
    user_features = user_df[feature_cols].values

    # 정규화 (MFCC, pitch)
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
    
    # 싫어요 곡 페널티
    if disliked_song_ids:
        disliked_mask = all_songs_df["song_id"].isin(disliked_song_ids).values
        sims[disliked_mask] *= penalty_factor

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
        "genre": all_songs_df["genre"].iloc[top_indices].values  
    })

    return recommendations


