# -*- coding: utf-8 -*-
import os
import sys
import pandas as pd
import logging

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(PROJECT_ROOT)

from voice_analysis.user.user_extract_feature import process_user_audio
from vector_db import PineconeRecommender

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def main():
    # 사용자 입력
    user_audio_path = "C:/min/special_pj/data/26.wav"   # 사용자의 음성 파일 경로
    pitch_low = 100.0
    pitch_high = 320.0
    pitch_avg = 180.0
    user_feature_csv = "C:/Users/SSAFY/Desktop/output/user_features.csv"

    # 사용자 음성 분석 및 feature 추출
    logging.info("사용자 음성 피처 추출 시작")
    user_df = process_user_audio(
        audio_path=user_audio_path,
        pitch_low=pitch_low,
        pitch_high=pitch_high,
        pitch_avg=pitch_avg,
        output_csv=user_feature_csv
    )
    if user_df is None:
        logging.error("사용자 피처 추출 실패")
        return

    # Pinecone 추천 시스템 초기화
    logging.info("Pinecone 추천 시스템 연결 중...")
    recommender = PineconeRecommender()

    if not recommender.connect():
        logging.error("Pinecone 연결 실패")
        return

    # 추천 실행
    logging.info("Pinecone 기반 추천 곡 계산 시작")
    recommendations = recommender.get_recommendations_by_user_df(
        user_df=user_df,
        top_n=10,
        min_popularity=1000,
        use_pitch_filter=True
    )

    if recommendations.empty:
        logging.warning("추천 결과가 없습니다.")
    else:
        logging.info("✅ Pinecone 추천 결과:")
        print(recommendations)

        # 인덱스 통계도 출력
        stats = recommender.get_index_stats()
        if stats:
            logging.info(f"인덱스 통계: {stats}")

if __name__ == "__main__":
    main()