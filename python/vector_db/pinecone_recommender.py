# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict, Optional
import pickle
import os
import sys

# 절대 경로로 import
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from vector_db.pinecone_config import PineconeConfig

class PineconeRecommender:
    def __init__(self):
        self.config = PineconeConfig()
        self.index = None
        self.scaler = None
        self.scaler_path = "vector_db/scaler.pkl"

    def connect(self):
        """Pinecone 연결 및 스케일러 로드"""
        try:
            # 인덱스 연결
            self.index = self.config.get_index()
            if self.index is None:
                return False

            # 스케일러 로드
            if os.path.exists(self.scaler_path):
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                logging.info("스케일러 로드 완료")
            else:
                logging.error(f"스케일러 파일을 찾을 수 없습니다: {self.scaler_path}")
                return False

            logging.info("Pinecone 추천 시스템 연결 성공")
            return True

        except Exception as e:
            logging.error(f"Pinecone 연결 실패: {e}")
            return False

    def prepare_user_vector(self, user_features: Dict) -> Optional[np.ndarray]:
        """사용자 피처를 벡터로 변환"""
        try:
            # MFCC + pitch 피처 추출
            feature_vector = []

            # MFCC 0-12
            for i in range(13):
                mfcc_key = f"mfcc_{i}"
                if mfcc_key in user_features:
                    feature_vector.append(user_features[mfcc_key])
                else:
                    logging.error(f"필수 피처 누락: {mfcc_key}")
                    return None

            # Pitch 피처
            for pitch_key in ["pitch_low", "pitch_high", "pitch_avg"]:
                if pitch_key in user_features:
                    feature_vector.append(user_features[pitch_key])
                else:
                    logging.error(f"필수 피처 누락: {pitch_key}")
                    return None

            # 정규화
            feature_array = np.array([feature_vector])
            normalized_vector = self.scaler.transform(feature_array)[0]

            return normalized_vector

        except Exception as e:
            logging.error(f"사용자 벡터 준비 오류: {e}")
            return None

    def get_recommendations(self,
                          user_features: Dict,
                          top_n: int = 10,
                          min_popularity: int = 0,
                          use_pitch_filter: bool = True,
                          allowed_genres: List[str] = None,
                          disliked_song_ids: List[int] = None,
                          penalty_factor: float = 0.1) -> pd.DataFrame:
        """Pinecone 기반 음악 추천"""
        try:
            if self.index is None or self.scaler is None:
                logging.error("Pinecone이 연결되지 않았습니다.")
                return pd.DataFrame()

            # 사용자 벡터 준비
            user_vector = self.prepare_user_vector(user_features)
            if user_vector is None:
                return pd.DataFrame()

            # Pinecone 검색 필터 준비
            filter_conditions = {"popularity": {"$gte": min_popularity}}

            # Pitch 필터 추가
            if use_pitch_filter:
                user_pitch_low = user_features.get("pitch_low", 0)
                user_pitch_high = user_features.get("pitch_high", 1000)
                user_pitch_avg = user_features.get("pitch_avg", 200)

                filter_conditions.update({
                    "pitch_low": {"$gte": user_pitch_low},
                    "pitch_high": {"$lte": user_pitch_high},
                    "pitch_avg": {
                        "$gte": user_pitch_avg - 20,
                        "$lte": user_pitch_avg + 20
                    }
                })

            # 장르 필터 추가 (정확한 매칭 사용)
            if allowed_genres:
                # Pinecone은 $regex를 지원하지 않으므로 $in 연산자 사용
                filter_conditions["genre"] = {"$in": allowed_genres}

            # Pinecone 유사도 검색 (여유분 확보 - dislike 패널티를 위해 더 많이 가져옴)
            if disliked_song_ids:
                # 싫어요 곡 수에 따라 동적으로 조정
                dislike_count = len(disliked_song_ids)
                # 기본 3배 + 싫어요 곡당 추가 2배, 최대 20배까지
                multiplier = min(20, 3 + (dislike_count * 2))
                search_k = top_n * multiplier
                logging.info(f"싫어요 곡 {dislike_count}개로 인해 검색 결과를 {multiplier}배({search_k}개) 확대")
            else:
                search_k = top_n * 3
            search_results = self.index.query(
                vector=user_vector.tolist(),
                top_k=search_k,
                filter=filter_conditions,
                include_metadata=True
            )

            # 결과 파싱
            recommendations = []
            for match in search_results.matches:
                song_data = {
                    "song_id": int(match.id),
                    "similarity": float(match.score),
                    "popularity": match.metadata.get("popularity", 0),
                    "pitch_low": match.metadata.get("pitch_low", 0),
                    "pitch_high": match.metadata.get("pitch_high", 0),
                    "pitch_avg": match.metadata.get("pitch_avg", 0),
                    "genre": match.metadata.get("genre", "")  # 장르 정보 추가
                }
                recommendations.append(song_data)

            # voice analysis 기반 점수 계산 (기존 로직 반영)
            for rec in recommendations:
                vector_score = rec["similarity"]

                # pitch 조건 체크 (기존 voice analysis 로직과 동일)
                user_pitch_low = user_features.get("pitch_low", 0)
                user_pitch_high = user_features.get("pitch_high", 1000)
                user_pitch_avg = user_features.get("pitch_avg", 200)

                pitch_condition_satisfied = (
                    rec["pitch_low"] >= user_pitch_low and
                    rec["pitch_high"] <= user_pitch_high and
                    abs(rec["pitch_avg"] - user_pitch_avg) <= 20
                )

                # pitch 유사도 계산 (더 세밀한 계산)
                pitch_diff_low = abs(rec["pitch_low"] - user_pitch_low)
                pitch_diff_high = abs(rec["pitch_high"] - user_pitch_high)
                pitch_diff_avg = abs(rec["pitch_avg"] - user_pitch_avg)

                # pitch 점수 (기존 voice analysis 로직 참고)
                pitch_score_low = max(0, 1 - (pitch_diff_low / 100))
                pitch_score_high = max(0, 1 - (pitch_diff_high / 100))
                pitch_score_avg = max(0, 1 - (pitch_diff_avg / 50))

                pitch_score = (pitch_score_low + pitch_score_high + pitch_score_avg) / 3

                # pitch 조건을 만족하지 않으면 패널티
                if not pitch_condition_satisfied:
                    pitch_score *= 0.5

                # 최종 점수: 벡터 유사도와 pitch 유사도 가중 평균 (기존 로직 반영)
                final_score = (vector_score * 0.6) + (pitch_score * 0.4)

                # 인기도 보너스 (기존 voice analysis 로직 참고)
                popularity_bonus = min(0.1, rec["popularity"] / 100000)  # 최대 10% 보너스
                final_score += popularity_bonus

                rec["final_score"] = final_score
                rec["pitch_score"] = pitch_score
                rec["pitch_condition_satisfied"] = pitch_condition_satisfied

            # 싫어요 곡에 페널티 적용 (recommend_with_voice.py와 동일한 방식)
            if disliked_song_ids:
                for rec in recommendations:
                    if rec["song_id"] in disliked_song_ids:
                        rec["final_score"] *= penalty_factor
                        rec["similarity"] *= penalty_factor  # 원래 유사도도 페널티 적용
                        logging.debug(f"곡 ID {rec['song_id']}에 dislike 페널티({penalty_factor}) 적용")

            # 최종 점수로 정렬 (기존 voice analysis와 동일한 우선순위)
            recommendations.sort(key=lambda x: x["final_score"], reverse=True)

            # DataFrame 변환 후 상위 N개 선택
            result_df = pd.DataFrame(recommendations[:top_n])

            logging.info(f"추천 완료: {len(result_df)}곡")
            return result_df

        except Exception as e:
            logging.error(f"추천 오류: {e}")
            return pd.DataFrame()

    def get_recommendations_by_user_df(self,
                                     user_df: pd.DataFrame,
                                     top_n: int = 10,
                                     min_popularity: int = 0,
                                     use_pitch_filter: bool = True,
                                     allowed_genres: List[str] = None,
                                     disliked_song_ids: List[int] = None,
                                     penalty_factor: float = 0.1) -> pd.DataFrame:
        """기존 인터페이스 호환성을 위한 래퍼"""
        try:
            if user_df.empty:
                return pd.DataFrame()

            # DataFrame을 Dict로 변환
            user_features = {}
            for i in range(13):
                mfcc_col = f"mfcc_{i}"
                if mfcc_col in user_df.columns:
                    user_features[mfcc_col] = user_df[mfcc_col].iloc[0]

            for pitch_col in ["pitch_low", "pitch_high", "pitch_avg"]:
                if pitch_col in user_df.columns:
                    user_features[pitch_col] = user_df[pitch_col].iloc[0]

            return self.get_recommendations(
                user_features=user_features,
                top_n=top_n,
                min_popularity=min_popularity,
                use_pitch_filter=use_pitch_filter,
                allowed_genres=allowed_genres,
                disliked_song_ids=disliked_song_ids,
                penalty_factor=penalty_factor
            )

        except Exception as e:
            logging.error(f"DataFrame 추천 오류: {e}")
            return pd.DataFrame()

    def get_index_stats(self):
        """인덱스 통계 반환"""
        try:
            if self.index is None:
                return None
            return self.index.describe_index_stats()
        except Exception as e:
            logging.error(f"통계 조회 오류: {e}")
            return None