# -*- coding: utf-8 -*-
import os
import sys
import logging

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(PROJECT_ROOT)

from vector_db.pinecone_config import PineconeConfig

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def check_pinecone_status():
    """Pinecone 인덱스 상태 확인"""
    try:
        # Pinecone 설정 초기화
        config = PineconeConfig()

        # 인덱스 연결
        index = config.get_index()
        if index is None:
            logging.error("인덱스 연결 실패")
            return

        # 인덱스 통계 확인
        stats = index.describe_index_stats()
        logging.info("=== Pinecone 인덱스 통계 ===")
        logging.info(f"인덱스 이름: {config.index_name}")
        logging.info(f"전체 벡터 수: {stats.total_vector_count}")
        logging.info(f"네임스페이스별 통계:")

        for namespace, info in stats.namespaces.items():
            logging.info(f"  - {namespace}: {info.vector_count}개 벡터")

        # 최근 업로드된 사용자 벡터 확인 (사용자 타입)
        logging.info("\n=== 사용자 벡터 검색 (최근 5개) ===")
        try:
            # 더미 벡터로 검색 (사용자 타입만)
            dummy_vector = [0.0] * 16
            user_results = index.query(
                vector=dummy_vector,
                top_k=5,
                filter={"type": "user"},
                include_metadata=True
            )

            if user_results.matches:
                for match in user_results.matches:
                    metadata = match.metadata
                    logging.info(f"사용자 벡터 ID: {match.id}")
                    logging.info(f"  - user_id: {metadata.get('user_id')}")
                    logging.info(f"  - upload_id: {metadata.get('upload_id')}")
                    logging.info(f"  - song_id: {metadata.get('song_id', 'N/A')}")
                    logging.info(f"  - created_at: {metadata.get('created_at')}")
                    logging.info("")
            else:
                logging.info("사용자 벡터가 없습니다.")

        except Exception as e:
            logging.error(f"사용자 벡터 검색 오류: {e}")

        # 음악 벡터 확인 (음악 타입)
        logging.info("=== 음악 벡터 검색 (최근 5개) ===")
        try:
            # 더미 벡터로 검색 (음악만, 사용자 타입 제외)
            music_results = index.query(
                vector=dummy_vector,
                top_k=5,
                filter={"type": {"$ne": "user"}},  # 사용자가 아닌 것들 (음악)
                include_metadata=True
            )

            if music_results.matches:
                for match in music_results.matches:
                    metadata = match.metadata
                    logging.info(f"음악 벡터 ID: {match.id}")
                    logging.info(f"  - song_id: {match.id}")
                    logging.info(f"  - popularity: {metadata.get('popularity', 'N/A')}")
                    logging.info(f"  - pitch_avg: {metadata.get('pitch_avg', 'N/A')}")
                    logging.info("")
            else:
                logging.info("음악 벡터가 없습니다.")

        except Exception as e:
            logging.error(f"음악 벡터 검색 오류: {e}")

        # 전체 벡터 샘플 확인
        logging.info("=== 전체 벡터 샘플 (최근 10개) ===")
        try:
            all_results = index.query(
                vector=dummy_vector,
                top_k=10,
                include_metadata=True
            )

            for match in all_results.matches:
                metadata = match.metadata
                vector_type = metadata.get('type', 'music')
                logging.info(f"벡터 ID: {match.id}, 타입: {vector_type}")

        except Exception as e:
            logging.error(f"전체 벡터 검색 오류: {e}")

    except Exception as e:
        logging.error(f"Pinecone 상태 확인 오류: {e}")

if __name__ == "__main__":
    check_pinecone_status()