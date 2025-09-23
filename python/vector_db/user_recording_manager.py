# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict, Optional
import pickle
import os
import sys
from datetime import datetime

# 절대 경로로 import
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from vector_db.user_recording_config import UserRecordingConfig

class UserRecordingManager:
    """사용자 녹음 벡터 관리 (record_id/upload_id 기반)"""

    def __init__(self):
        self.config = UserRecordingConfig()
        self.index = None
        self.scaler = None
        self.scaler_path = "vector_db/scaler.pkl"  # 기존 음악 DB와 동일한 스케일러 사용

    def connect(self):
        """Pinecone 연결 및 스케일러 로드"""
        try:
            # 인덱스 생성 (없는 경우)
            if not self.config.create_index():
                return False

            # 인덱스 연결
            self.index = self.config.get_index()
            if self.index is None:
                return False

            # 스케일러 로드 (음악 DB와 동일한 정규화 기준 사용)
            if os.path.exists(self.scaler_path):
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
            else:
                logging.warning("스케일러가 없습니다. 음악 데이터 업로드를 먼저 실행하세요.")
                return False

            logging.info("사용자 녹음 매니저 연결 성공")
            return True

        except Exception as e:
            logging.error(f"연결 실패: {e}")
            return False

    def save_user_recording(self,
                          record_id: str,  # 또는 upload_id
                          user_id: str,
                          song_id: str,
                          user_features: Dict) -> bool:
        """사용자 녹음 벡터 저장"""
        try:
            if self.index is None or self.scaler is None:
                logging.error("Pinecone이 연결되지 않았습니다.")
                return False

            # 피처 벡터 준비
            feature_vector = []
            for i in range(13):
                mfcc_key = f"mfcc_{i}"
                if mfcc_key in user_features:
                    feature_vector.append(user_features[mfcc_key])
                else:
                    logging.error(f"필수 피처 누락: {mfcc_key}")
                    return False

            for pitch_key in ["pitch_low", "pitch_high", "pitch_avg"]:
                if pitch_key in user_features:
                    feature_vector.append(user_features[pitch_key])
                else:
                    logging.error(f"필수 피처 누락: {pitch_key}")
                    return False

            # 정규화 (음악 DB와 동일한 기준)
            feature_array = np.array([feature_vector])
            normalized_vector = self.scaler.transform(feature_array)[0]

            # 메타데이터 준비
            metadata = {
                "type": "user_recording",
                "record_id": str(record_id),
                "user_id": str(user_id),
                "song_id": str(song_id),
                "pitch_low": float(user_features["pitch_low"]),
                "pitch_high": float(user_features["pitch_high"]),
                "pitch_avg": float(user_features["pitch_avg"]),
                "created_at": datetime.now().isoformat()
            }

            # Pinecone에 업로드
            upsert_data = [{
                "id": str(record_id),  # record_id를 벡터 ID로 사용
                "values": normalized_vector.tolist(),
                "metadata": metadata
            }]

            response = self.index.upsert(vectors=upsert_data)
            logging.info(f"사용자 녹음 벡터 저장 완료: {record_id}")

            return True

        except Exception as e:
            logging.error(f"사용자 녹음 벡터 저장 오류: {e}")
            return False

    def get_similar_user_recordings(self,
                                  user_features: Dict,
                                  exclude_user_id: str = None,
                                  top_k: int = 50) -> List[Dict]:
        """유사한 목소리의 다른 사용자 녹음 찾기"""
        try:
            if self.index is None or self.scaler is None:
                return []

            # 쿼리 벡터 준비
            feature_vector = []
            for i in range(13):
                feature_vector.append(user_features[f"mfcc_{i}"])
            for pitch_key in ["pitch_low", "pitch_high", "pitch_avg"]:
                feature_vector.append(user_features[pitch_key])

            # 정규화
            feature_array = np.array([feature_vector])
            query_vector = self.scaler.transform(feature_array)[0]

            # 필터 조건 (자신의 녹음 제외)
            filter_conditions = {"type": "user_recording"}
            if exclude_user_id:
                filter_conditions["user_id"] = {"$ne": str(exclude_user_id)}

            # 유사도 검색
            search_results = self.index.query(
                vector=query_vector.tolist(),
                top_k=top_k,
                filter=filter_conditions,
                include_metadata=True
            )

            # 결과 파싱
            similar_recordings = []
            for match in search_results.matches:
                recording_data = {
                    "record_id": match.metadata.get("record_id"),
                    "user_id": match.metadata.get("user_id"),
                    "song_id": match.metadata.get("song_id"),
                    "similarity": float(match.score),
                    "pitch_low": match.metadata.get("pitch_low"),
                    "pitch_high": match.metadata.get("pitch_high"),
                    "pitch_avg": match.metadata.get("pitch_avg"),
                    "created_at": match.metadata.get("created_at")
                }
                similar_recordings.append(recording_data)

            logging.info(f"유사한 녹음 {len(similar_recordings)}개 발견")
            return similar_recordings

        except Exception as e:
            logging.error(f"유사 녹음 검색 오류: {e}")
            return []

    def get_user_recordings(self, user_id: str) -> List[Dict]:
        """특정 사용자의 모든 녹음 조회"""
        try:
            if self.index is None:
                return []

            # 사용자별 필터링
            query_result = self.index.query(
                vector=[0] * 16,  # 더미 벡터
                top_k=1000,  # 충분히 큰 값
                filter={"user_id": str(user_id), "type": "user_recording"},
                include_metadata=True
            )

            recordings = []
            for match in query_result.matches:
                recordings.append({
                    "record_id": match.metadata.get("record_id"),
                    "song_id": match.metadata.get("song_id"),
                    "created_at": match.metadata.get("created_at"),
                    "pitch_low": match.metadata.get("pitch_low"),
                    "pitch_high": match.metadata.get("pitch_high"),
                    "pitch_avg": match.metadata.get("pitch_avg")
                })

            return sorted(recordings, key=lambda x: x["created_at"], reverse=True)

        except Exception as e:
            logging.error(f"사용자 녹음 조회 오류: {e}")
            return []

    def delete_recording(self, record_id: str) -> bool:
        """특정 녹음 삭제"""
        try:
            if self.index is None:
                return False

            self.index.delete(ids=[str(record_id)])
            logging.info(f"녹음 삭제 완료: {record_id}")
            return True

        except Exception as e:
            logging.error(f"녹음 삭제 오류: {e}")
            return False

    def get_stats(self):
        """인덱스 통계 조회"""
        try:
            if self.index is None:
                return None

            stats = self.index.describe_index_stats()
            return stats

        except Exception as e:
            logging.error(f"통계 조회 오류: {e}")
            return None