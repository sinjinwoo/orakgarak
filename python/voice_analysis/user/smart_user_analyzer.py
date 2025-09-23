# -*- coding: utf-8 -*-
import os
import sys
import pandas as pd
import logging
from typing import Optional, Dict

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(PROJECT_ROOT)

from voice_analysis.user.user_extract_feature import process_user_audio
from vector_db.user_vector_manager import UserVectorManager

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

class SmartUserAnalyzer:
    def __init__(self):
        self.vector_manager = UserVectorManager()
        self.connected = False

    def connect(self):
        """Pinecone 연결"""
        self.connected = self.vector_manager.connect()
        return self.connected

    def analyze_user_voice(self,
                          user_id: str,
                          audio_path: str,
                          pitch_low: float,
                          pitch_high: float,
                          pitch_avg: float,
                          upload_id: str = None,
                          force_reanalyze: bool = False) -> Optional[Dict]:
        """스마트 사용자 음성 분석 (중복 분석 방지)"""

        if not self.connected:
            logging.error("Pinecone 연결이 필요합니다.")
            return None

        try:
            # 1. 기존 분석 결과 확인 (upload_id가 있는 경우)
            if upload_id and not force_reanalyze:
                existing_vector = self.vector_manager.check_user_vector_exists(user_id, upload_id)
                if existing_vector:
                    logging.info(f"✅ 기존 분석 결과 발견: {upload_id}")

                    # 기존 메타데이터에서 피처 복원
                    user_features = {
                        "pitch_low": existing_vector["metadata"]["pitch_low"],
                        "pitch_high": existing_vector["metadata"]["pitch_high"],
                        "pitch_avg": existing_vector["metadata"]["pitch_avg"]
                    }

                    # 벡터에서 MFCC 복원 (역정규화 필요시)
                    vector = existing_vector["vector"]
                    for i in range(13):
                        user_features[f"mfcc_{i}"] = vector[i]  # 이미 정규화된 값

                    return {
                        "user_id": user_id,
                        "upload_id": existing_vector["metadata"]["upload_id"],
                        "vector_id": existing_vector["id"],
                        "features": user_features,
                        "from_cache": True
                    }

            # 2. 새로운 음성 분석 실행
            logging.info(f"🎤 새로운 음성 분석 시작: {user_id}")

            user_df = process_user_audio(
                audio_path=audio_path,
                pitch_low=pitch_low,
                pitch_high=pitch_high,
                pitch_avg=pitch_avg,
                output_csv=None  # CSV 저장 안함
            )

            if user_df is None or user_df.empty:
                logging.error("음성 분석 실패")
                return None

            # 3. 피처 딕셔너리 변환
            user_features = {}
            for i in range(13):
                mfcc_col = f"mfcc_{i}"
                if mfcc_col in user_df.columns:
                    user_features[mfcc_col] = user_df[mfcc_col].iloc[0]

            for pitch_col in ["pitch_low", "pitch_high", "pitch_avg"]:
                if pitch_col in user_df.columns:
                    user_features[pitch_col] = user_df[pitch_col].iloc[0]

            # 4. Pinecone에 저장
            vector_id = self.vector_manager.save_user_vector(
                user_id=user_id,
                user_features=user_features,
                upload_id=upload_id
            )

            if not vector_id:
                logging.error("벡터 저장 실패")
                return None

            logging.info(f"✅ 새로운 분석 완료 및 저장: {vector_id}")

            return {
                "user_id": user_id,
                "upload_id": upload_id or vector_id.split('_')[-1],
                "vector_id": vector_id,
                "features": user_features,
                "from_cache": False
            }

        except Exception as e:
            logging.error(f"음성 분석 오류: {e}")
            return None

    def get_user_history(self, user_id: str) -> list:
        """사용자 분석 이력 조회"""
        if not self.connected:
            return []

        return self.vector_manager.get_user_history(user_id)

    def delete_user_analysis(self, user_id: str, upload_id: str) -> bool:
        """특정 분석 결과 삭제"""
        if not self.connected:
            return False

        return self.vector_manager.delete_user_vector(user_id, upload_id)

    def get_user_features_for_recommendation(self, user_id: str, upload_id: str = None) -> Optional[pd.DataFrame]:
        """추천용 사용자 피처 DataFrame 반환"""
        if not self.connected:
            return None

        try:
            existing_vector = self.vector_manager.check_user_vector_exists(user_id, upload_id)
            if not existing_vector:
                return None

            # 메타데이터에서 피처 복원
            features_dict = {}

            # Pitch 정보
            features_dict["pitch_low"] = existing_vector["metadata"]["pitch_low"]
            features_dict["pitch_high"] = existing_vector["metadata"]["pitch_high"]
            features_dict["pitch_avg"] = existing_vector["metadata"]["pitch_avg"]

            # 벡터에서 MFCC 복원 (정규화된 상태)
            vector = existing_vector["vector"]
            for i in range(13):
                features_dict[f"mfcc_{i}"] = vector[i]

            # DataFrame 변환
            user_df = pd.DataFrame([features_dict])
            return user_df

        except Exception as e:
            logging.error(f"추천용 피처 조회 오류: {e}")
            return None