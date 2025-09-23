# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict, Optional
import pickle
import os
from .pinecone_config import PineconeConfig

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
                          min_popularity: int = 1000,
                          use_pitch_filter: bool = True) -> pd.DataFrame:
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

            # Pinecone 유사도 검색
            search_results = self.index.query(
                vector=user_vector.tolist(),
                top_k=top_n * 2,  # 필터링 여유분
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
                    "pitch_avg": match.metadata.get("pitch_avg", 0)
                }
                recommendations.append(song_data)

            # DataFrame 변환
            result_df = pd.DataFrame(recommendations)

            # 상위 N개만 반환
            if len(result_df) > top_n:
                result_df = result_df.head(top_n)

            logging.info(f"추천 완료: {len(result_df)}곡")
            return result_df

        except Exception as e:
            logging.error(f"추천 오류: {e}")
            return pd.DataFrame()

    def get_recommendations_by_user_df(self,
                                     user_df: pd.DataFrame,
                                     top_n: int = 10,
                                     min_popularity: int = 1000,
                                     use_pitch_filter: bool = True) -> pd.DataFrame:
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
                use_pitch_filter=use_pitch_filter
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