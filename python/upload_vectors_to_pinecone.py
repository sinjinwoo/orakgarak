# -*- coding: utf-8 -*-
import os
import sys
import logging

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.append(PROJECT_ROOT)

from vector_db import VectorUploader

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

def main():
    """filtered_features.csv를 Pinecone에 업로드"""

    # CSV 파일 경로
    csv_path = os.path.join(PROJECT_ROOT, "dataset", "filtered_features.csv")

    if not os.path.exists(csv_path):
        logging.error(f"CSV 파일을 찾을 수 없습니다: {csv_path}")
        return

    # 업로더 초기화
    uploader = VectorUploader()

    # 업로드 실행
    logging.info("=== Pinecone 벡터 업로드 시작 ===")
    success = uploader.upload_from_csv(csv_path)

    if success:
        logging.info("✅ 벡터 업로드 성공!")

        # 통계 조회
        stats = uploader.get_stats()
        if stats:
            logging.info(f"인덱스 통계: {stats}")
    else:
        logging.error("❌ 벡터 업로드 실패")

if __name__ == "__main__":
    main()