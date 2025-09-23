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
                               use_pitch_filter: bool = True) -> pd.DataFrame:
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
            use_pitch_filter=use_pitch_filter
        )
    except Exception as e:
        print(f"Pinecone 추천 오류: {e}")
        return pd.DataFrame()


def get_recommendations(user_df: pd.DataFrame,
                        all_songs_df: pd.DataFrame = None,
                        top_n: int = 10,
                        min_popularity: int = 1000,
                        use_pitch_filter: bool = True,
                        use_pinecone: bool = True) -> pd.DataFrame:

    """통합 추천 함수 - Pinecone 우선, 실패시 CSV 방식"""

    # 1. Pinecone 방식 시도
    if use_pinecone and PINECONE_AVAILABLE:
        try:
            pinecone_result = get_recommendations_pinecone(
                user_df=user_df,
                top_n=top_n,
                min_popularity=min_popularity,
                use_pitch_filter=use_pitch_filter
            )
            if not pinecone_result.empty:
                print("✅ Pinecone 추천 성공")
                return pinecone_result
            else:
                print("⚠️ Pinecone 추천 결과 없음, CSV 방식으로 전환")
        except Exception as e:
            print(f"⚠️ Pinecone 추천 오류: {e}, CSV 방식으로 전환")

    # 2. CSV 방식 (기존 로직)
    if all_songs_df is None:
        print("❌ all_songs_df가 제공되지 않았습니다.")
        return pd.DataFrame()

    print("📊 CSV 기반 추천 실행")

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
