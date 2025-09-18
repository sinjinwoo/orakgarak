import os
import sys
import pandas as pd
import logging

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from voice_analysis.user.user_extract_feature import process_user_audio
from recommend.recommend_with_voice import get_recommendations

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

    # 전체 곡 feature 불러오기
    all_features_csv = "C:/Users/SSAFY/Desktop/output/all_features.csv"
    if not os.path.exists(all_features_csv):
        logging.error(f"곡 feature 파일이 존재하지 않습니다: {all_features_csv}")
        return

    all_songs_df = pd.read_csv(all_features_csv)
    logging.info(f"전체 곡 feature 불러오기 완료: {len(all_songs_df)}곡")

    # 추천 실행
    logging.info("추천 곡 계산 시작")
    recommendations = get_recommendations(user_df, all_songs_df, top_n=10)

    if recommendations.empty:
        logging.warning("추천 결과가 없습니다.")
    else:
        logging.info("추천 결과:")
        print(recommendations)

if __name__ == "__main__":
    main()
