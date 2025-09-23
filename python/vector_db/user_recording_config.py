# -*- coding: utf-8 -*-
import os
from pinecone import Pinecone, ServerlessSpec
from dotenv import load_dotenv
import logging

load_dotenv()

class UserRecordingConfig:
    """사용자 녹음 전용 Pinecone 설정"""

    def __init__(self):
        self.api_key = os.getenv('PINE_CONE_API_KEY')
        self.environment = os.getenv('PINECONE_ENVIRONMENT', 'us-east-1')
        self.index_name = "user-recordings-vectors"  # 사용자 녹음 전용 인덱스
        self.dimension = 16  # 13 MFCC + 3 pitch features

        if not self.api_key:
            raise ValueError("PINE_CONE_API_KEY가 환경변수에 설정되지 않았습니다.")

        self.pc = Pinecone(api_key=self.api_key)

    def create_index(self):
        """사용자 녹음 전용 Pinecone 인덱스 생성"""
        try:
            # 기존 인덱스 확인
            existing_indexes = [index.name for index in self.pc.list_indexes()]

            if self.index_name in existing_indexes:
                logging.info(f"사용자 녹음 인덱스 '{self.index_name}'가 이미 존재합니다.")
                return True

            # 새 인덱스 생성
            self.pc.create_index(
                name=self.index_name,
                dimension=self.dimension,
                metric='cosine',
                spec=ServerlessSpec(
                    cloud='aws',
                    region=self.environment
                )
            )

            logging.info(f"사용자 녹음 인덱스 '{self.index_name}' 생성 완료")
            return True

        except Exception as e:
            logging.error(f"사용자 녹음 인덱스 생성 오류: {e}")
            return False

    def get_index(self):
        """사용자 녹음 Pinecone 인덱스 반환"""
        try:
            return self.pc.Index(self.index_name)
        except Exception as e:
            logging.error(f"사용자 녹음 인덱스 연결 오류: {e}")
            return None

    def delete_index(self):
        """사용자 녹음 인덱스 삭제 (개발/테스트용)"""
        try:
            self.pc.delete_index(self.index_name)
            logging.info(f"사용자 녹음 인덱스 '{self.index_name}' 삭제 완료")
            return True
        except Exception as e:
            logging.error(f"사용자 녹음 인덱스 삭제 오류: {e}")
            return False