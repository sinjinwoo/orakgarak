import os
import sys
import pandas as pd
import logging

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from voice_analysis.features.extract_mel import extract_mel
from voice_analysis.features.extract_features import extract_features
from recommend.recommend_with_voice import get_recommendations
from voice_analysis.user.voice_keyword_generator import analyze_voice

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def main():
    # 사용자 입력
    user_audio_path = "C:/min/special_pj/data/sample_data.wav"   # 사용자의 음성 파일 경로

    logging.info("사용자 음색 피처 추출 시작")

    # 멜 스펙트로그램 추출
    mel = extract_mel(user_audio_path)

    # 특성 추출 
    features = extract_features(mel)

    # DataFrame 생성
    feature_dict = {
        "song_id": ["user_audio"],
    }
    for i, val in enumerate(features['mfcc']):
        feature_dict[f"mfcc_{i}"] = [val]

    feature_dict["pitch_low"] = [features['pitch_low']]
    feature_dict["pitch_high"] = [features['pitch_high']]
    feature_dict["pitch_avg"] = [features['pitch_avg']]
    feature_dict["popularity"] = [0.0]

    user_df = pd.DataFrame(feature_dict)
    logging.info(
        f"자동 추출된 pitch: low={features['pitch_low']:.2f}, "
        f"high={features['pitch_high']:.2f}, avg={features['pitch_avg']:.2f}"
    )

    # 사용자 음색 키워드 추출
    logging.info("사용자 음색 키워드 생성 시작")
    try:
        voice_result = analyze_voice(user_audio_path)  # dict 반환
        print("="*50)
        print("[사용자 목소리 분석 결과]")
        print(voice_result["summary"])
        print(f"키워드: {voice_result['desc']}")
        print(f"추천 장르 Top3: {voice_result['allowed_genres']}")
        print("="*50)
    except Exception as e:
        logging.error(f"목소리 분석 중 오류: {e}")
        voice_result = {"summary": None, "desc": [], "allowed_genres": []}

    # 전체 곡 feature 불러오기
    all_features_csv = "C:/Users/SSAFY/Desktop/output/filtered_features.csv"
    if not os.path.exists(all_features_csv):
        logging.error(f"곡 feature 파일이 존재하지 않습니다: {all_features_csv}")
        return

    all_songs_df = pd.read_csv(all_features_csv)
    logging.info(f"전체 곡 feature 불러오기 완료: {len(all_songs_df)}곡")

    ################################# 디버깅 용
    # 곡명, 가수명까지 같이 출력
    # meta_csv = "C:/Users/SSAFY/Desktop/output/song_meta_simple.csv"
    # if not os.path.exists(meta_csv):
    #     logging.error(f"메타데이터 파일이 존재하지 않습니다: {meta_csv}")
    #     return
    # song_meta_df = pd.read_csv(meta_csv)
    #################################

    # 추천 실행
    logging.info("추천 곡 계산 시작")
    recommendations = get_recommendations(
        user_df,
        all_songs_df,
        top_n=10,
        allowed_genres=voice_result["allowed_genres"]  # 장르 필터링 적용
    )

    if recommendations.empty:
        logging.warning("추천 결과가 없습니다.")
    else:
        logging.info("추천 결과:")

        print(recommendations)


        # 곡명, 가수명까지 출력하고 싶을 때
        # recommendations_debug = recommendations.merge(
        #     song_meta_df[["song_id", "song_name", "artist_names"]],
        #     on="song_id",
        #     how="left"
        # )

        # print(
        #     recommendations_debug.head(10)[
        #         [
        #             "song_id",
        #             "song_name",
        #             "artist_names",
        #             "genre",
        #             "similarity",
        #             "pitch_low",
        #             "pitch_high",
        #             "pitch_avg",
        #         ]
        #     ]
        # )


if __name__ == "__main__":
    main()
