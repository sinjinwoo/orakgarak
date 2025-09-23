# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict, Optional
import pickle
import os
import sys
import hashlib
from datetime import datetime

# 절대 경로로 import
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from vector_db.user_recording_config import UserRecordingConfig

class UserVectorManager:
    def __init__(self):
        self.config = UserRecordingConfig()
        # 사용자 전용 인덱스 사용
        self.index = None
        self.scaler = None
        self.scaler_path = "vector_db/scaler.pkl"

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

            # 스케일러 로드
            if os.path.exists(self.scaler_path):
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
            else:
                logging.warning("스케일러가 없습니다. 음악 데이터 업로드를 먼저 실행하세요.")
                return False

            logging.info("사용자 벡터 매니저 연결 성공")
            return True

        except Exception as e:
            logging.error(f"연결 실패: {e}")
            return False

    def generate_user_id(self, user_id: str, upload_id: str = None) -> str:
        """사용자 고유 ID 생성"""
        if upload_id:
            return f"user_{user_id}_{upload_id}"
        else:
            # 현재 시간 기반 upload_id 생성
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            return f"user_{user_id}_{timestamp}"

    def check_user_vector_exists(self, user_id: str, upload_id: str = None) -> Optional[Dict]:
        """기존 사용자 벡터 확인"""
        try:
            if self.index is None:
                return None

            vector_id = self.generate_user_id(user_id, upload_id)

            # Pinecone에서 조회
            result = self.index.fetch(ids=[vector_id])

            if vector_id in result.vectors:
                vector_data = result.vectors[vector_id]
                return {
                    "id": vector_id,
                    "vector": vector_data.values,
                    "metadata": vector_data.metadata
                }

            return None

        except Exception as e:
            logging.error(f"사용자 벡터 조회 오류: {e}")
            return None

    def save_user_vector(self, user_id: str, user_features: Dict, upload_id: str = None, voice_analysis: str = None, song_id: str = None, voice_desc: list = None, user_genres: list = None) -> str:
        """사용자 벡터 저장"""
        try:
            if self.index is None or self.scaler is None:
                logging.error("Pinecone이 연결되지 않았습니다.")
                return None

            # 벡터 ID 생성
            vector_id = self.generate_user_id(user_id, upload_id)

            # 피처 벡터 준비
            feature_vector = []
            for i in range(13):
                mfcc_key = f"mfcc_{i}"
                if mfcc_key in user_features:
                    feature_vector.append(user_features[mfcc_key])
                else:
                    logging.error(f"필수 피처 누락: {mfcc_key}")
                    return None

            for pitch_key in ["pitch_low", "pitch_high", "pitch_avg"]:
                if pitch_key in user_features:
                    feature_vector.append(user_features[pitch_key])
                else:
                    logging.error(f"필수 피처 누락: {pitch_key}")
                    return None

            # 정규화
            feature_array = np.array([feature_vector])
            normalized_vector = self.scaler.transform(feature_array)[0]

            # 메타데이터 준비 (사용자 구분용)
            metadata = {
                "type": "user",  # 음악과 구분
                "user_id": str(user_id),
                "upload_id": upload_id or datetime.now().strftime("%Y%m%d_%H%M%S"),
                "popularity": 0,  # 사용자는 0
                "pitch_low": float(user_features["pitch_low"]),
                "pitch_high": float(user_features["pitch_high"]),
                "pitch_avg": float(user_features["pitch_avg"]),
                "voice_analysis": voice_analysis or "",  # 음성 분석 요약
                "voice_desc": ", ".join(voice_desc) if voice_desc else "",  # 상세 설명
                "user_genres": ", ".join(user_genres) if user_genres else "",  # 어울리는 장르
                "created_at": datetime.now().isoformat()
            }

            # song_id가 있는 경우에만 추가 (Pinecone은 null 값을 허용하지 않음)
            if song_id is not None and song_id != "None" and song_id != "":
                metadata["song_id"] = str(song_id)

            # Pinecone에 업로드
            upsert_data = [{
                "id": vector_id,
                "values": normalized_vector.tolist(),
                "metadata": metadata
            }]

            response = self.index.upsert(vectors=upsert_data)
            logging.info(f"사용자 벡터 저장 완료: {vector_id}")

            return vector_id

        except Exception as e:
            logging.error(f"사용자 벡터 저장 오류: {e}")
            return None

    def get_user_vector(self, user_id: str, upload_id: str = None) -> Optional[np.ndarray]:
        """저장된 사용자 벡터 조회"""
        try:
            user_data = self.check_user_vector_exists(user_id, upload_id)
            if user_data:
                return np.array(user_data["vector"])
            return None

        except Exception as e:
            logging.error(f"사용자 벡터 조회 오류: {e}")
            return None

    def get_user_history(self, user_id: str) -> List[Dict]:
        """사용자의 모든 분석 기록 조회"""
        try:
            if self.index is None:
                return []

            # 사용자 ID로 필터링
            query_result = self.index.query(
                vector=[0] * 16,  # 더미 벡터
                top_k=100,
                filter={"user_id": str(user_id), "type": "user"},
                include_metadata=True
            )

            history = []
            for match in query_result.matches:
                history.append({
                    "vector_id": match.id,
                    "upload_id": match.metadata.get("upload_id"),
                    "created_at": match.metadata.get("created_at"),
                    "pitch_low": match.metadata.get("pitch_low"),
                    "pitch_high": match.metadata.get("pitch_high"),
                    "pitch_avg": match.metadata.get("pitch_avg"),
                    "voice_analysis": match.metadata.get("voice_analysis", ""),
                    "voice_desc": match.metadata.get("voice_desc", ""),
                    "user_genres": match.metadata.get("user_genres", "")
                })

            return sorted(history, key=lambda x: x["created_at"], reverse=True)

        except Exception as e:
            logging.error(f"사용자 기록 조회 오류: {e}")
            return []

    def delete_user_vector(self, user_id: str, upload_id: str) -> bool:
        """특정 사용자 벡터 삭제"""
        try:
            if self.index is None:
                return False

            vector_id = self.generate_user_id(user_id, upload_id)
            self.index.delete(ids=[vector_id])

            logging.info(f"사용자 벡터 삭제 완료: {vector_id}")
            return True

        except Exception as e:
            logging.error(f"사용자 벡터 삭제 오류: {e}")
            return False