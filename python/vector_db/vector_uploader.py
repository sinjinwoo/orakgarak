# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict, Tuple
import pickle
import os
from .pinecone_config import PineconeConfig

class VectorUploader:
    def __init__(self):
        self.config = PineconeConfig()
        self.index = None
        self.scaler = StandardScaler()
        self.scaler_path = "vector_db/scaler.pkl"

    def connect(self):
        """Pinecone 인덱스 연결"""
        try:
            # 인덱스 생성 (없는 경우)
            if not self.config.create_index():
                return False

            # 인덱스 연결
            self.index = self.config.get_index()
            if self.index is None:
                return False

            logging.info("Pinecone 연결 성공")
            return True

        except Exception as e:
            logging.error(f"Pinecone 연결 실패: {e}")
            return False

    def prepare_vectors_from_csv(self, csv_path: str) -> Tuple[List[str], np.ndarray, List[Dict]]:
        """CSV에서 벡터 데이터 준비"""
        try:
            # CSV 로드
            df = pd.read_csv(csv_path)
            logging.info(f"CSV 로드 완료: {len(df)}개 행")

            # 피처 컬럼
            feature_cols = [f"mfcc_{i}" for i in range(13)] + ["pitch_low", "pitch_high", "pitch_avg"]

            # 데이터 추출
            song_ids = df["song_id"].astype(str).tolist()
            features = df[feature_cols].values

            # 정규화
            features_scaled = self.scaler.fit_transform(features)

            # 메타데이터 준비
            metadata_list = []
            for idx, row in df.iterrows():
                metadata = {
                    "song_id": str(row["song_id"]),
                    "popularity": int(row.get("popularity", 0)),
                    "pitch_low": float(row["pitch_low"]),
                    "pitch_high": float(row["pitch_high"]),
                    "pitch_avg": float(row["pitch_avg"])
                }
                metadata_list.append(metadata)

            # 스케일러 저장
            os.makedirs(os.path.dirname(self.scaler_path), exist_ok=True)
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)

            logging.info(f"벡터 데이터 준비 완료: {len(song_ids)}개")
            return song_ids, features_scaled, metadata_list

        except Exception as e:
            logging.error(f"벡터 데이터 준비 오류: {e}")
            return [], np.array([]), []

    def upload_vectors(self, song_ids: List[str], vectors: np.ndarray, metadata_list: List[Dict], batch_size: int = 100):
        """Pinecone에 벡터 업로드"""
        try:
            if self.index is None:
                logging.error("Pinecone 인덱스가 연결되지 않았습니다.")
                return False

            total_count = len(song_ids)
            success_count = 0

            # 배치 단위로 업로드
            for i in range(0, total_count, batch_size):
                batch_end = min(i + batch_size, total_count)
                batch_ids = song_ids[i:batch_end]
                batch_vectors = vectors[i:batch_end]
                batch_metadata = metadata_list[i:batch_end]

                # Pinecone 형식으로 변환
                upsert_data = []
                for j, (song_id, vector, metadata) in enumerate(zip(batch_ids, batch_vectors, batch_metadata)):
                    upsert_data.append({
                        "id": song_id,
                        "values": vector.tolist(),
                        "metadata": metadata
                    })

                # 업로드
                try:
                    response = self.index.upsert(vectors=upsert_data)
                    success_count += len(batch_ids)
                    logging.info(f"배치 업로드 완료: {i+1}-{batch_end}/{total_count}")

                except Exception as e:
                    logging.error(f"배치 업로드 실패 ({i+1}-{batch_end}): {e}")
                    continue

            logging.info(f"전체 업로드 완료: {success_count}/{total_count}")
            return success_count == total_count

        except Exception as e:
            logging.error(f"벡터 업로드 오류: {e}")
            return False

    def upload_from_csv(self, csv_path: str):
        """CSV에서 Pinecone으로 직접 업로드"""
        try:
            # 연결
            if not self.connect():
                return False

            # 벡터 데이터 준비
            song_ids, vectors, metadata_list = self.prepare_vectors_from_csv(csv_path)

            if len(song_ids) == 0:
                logging.error("업로드할 데이터가 없습니다.")
                return False

            # 업로드
            return self.upload_vectors(song_ids, vectors, metadata_list)

        except Exception as e:
            logging.error(f"CSV 업로드 오류: {e}")
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