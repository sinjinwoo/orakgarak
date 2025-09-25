# -*- coding: utf-8 -*-
import pandas as pd
import pymysql as mysql
import os
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

def connect_to_db():
    """MySQL 데이터베이스 연결"""
    try:
        connection = mysql.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=int(os.getenv('DB_PORT', '3306')),
            user=os.getenv('DB_USERNAME', 'orakgaraki'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'orakgaraki'),
            charset='utf8mb4'
        )
        return connection
    except mysql.Error as e:
        print(f"데이터베이스 연결 오류: {e}")
        return None

def get_existing_songids(connection):
    """DB에서 존재하는 모든 song_id 조회"""
    cursor = connection.cursor()

    try:
        query = "SELECT DISTINCT song_id FROM songs ORDER BY song_id"
        cursor.execute(query)
        result = cursor.fetchall()

        # 튜플에서 리스트로 변환
        songids = [row[0] for row in result]
        print(f"DB에 존재하는 songid 개수: {len(songids)}")
        return songids

    except mysql.Error as e:
        print(f"songid 조회 오류: {e}")
        return []
    finally:
        cursor.close()

def filter_features_csv(csv_path, existing_songids):
    """all_features.csv에서 DB에 존재하는 song_id만 필터링"""
    try:
        print(f"CSV 파일 로드 중: {csv_path}")

        # CSV 읽기
        df = pd.read_csv(csv_path)
        print(f"전체 features 행 수: {len(df)}")
        print(f"CSV 컬럼: {list(df.columns)}")

        # DB에 존재하는 song_id만 필터링
        filtered_df = df[df['song_id'].isin(existing_songids)].copy()
        print(f"DB와 매칭되는 features 행 수: {len(filtered_df)}")

        # 매칭 통계
        csv_songids = set(df['song_id'].unique())
        db_songids = set(existing_songids)
        matched_songids = csv_songids.intersection(db_songids)

        print(f"CSV에만 있는 songid 개수: {len(csv_songids - db_songids)}")
        print(f"DB에만 있는 songid 개수: {len(db_songids - csv_songids)}")
        print(f"매칭되는 songid 개수: {len(matched_songids)}")

        return filtered_df

    except Exception as e:
        print(f"CSV 필터링 오류: {e}")
        return None

def save_filtered_csv(filtered_df, output_path):
    """필터링된 데이터를 새 CSV 파일로 저장"""
    try:
        filtered_df.to_csv(output_path, index=False, encoding='utf-8')
        print(f"필터링된 데이터 저장 완료: {output_path}")
        print(f"저장된 행 수: {len(filtered_df)}")
        return True
    except Exception as e:
        print(f"CSV 저장 오류: {e}")
        return False

def main():
    """메인 실행 함수"""
    # 파일 경로 설정
    features_csv_path = r"C:\Users\SSAFY\Desktop\S13P21C103\python\dataset\all_features.csv"
    output_csv_path = r"C:\Users\SSAFY\Desktop\S13P21C103\python\dataset\filtered_features.csv"

    # 입력 파일 존재 확인
    if not os.path.exists(features_csv_path):
        print(f"입력 파일을 찾을 수 없습니다: {features_csv_path}")
        return

    # 데이터베이스 연결
    connection = connect_to_db()
    if not connection:
        print("데이터베이스 연결 실패")
        return

    try:
        print("=== DB에서 songid 목록 조회 중 ===")
        existing_songids = get_existing_songids(connection)

        if not existing_songids:
            print("DB에서 songid를 조회할 수 없습니다.")
            return

        print("\n=== CSV 파일 필터링 중 ===")
        filtered_df = filter_features_csv(features_csv_path, existing_songids)

        if filtered_df is None or len(filtered_df) == 0:
            print("필터링된 데이터가 없습니다.")
            return

        print("\n=== 필터링된 데이터 저장 중 ===")
        if save_filtered_csv(filtered_df, output_csv_path):
            print(f"\n✅ 작업 완료!")
            print(f"필터링된 features 파일: {output_csv_path}")

    except Exception as e:
        print(f"실행 중 오류 발생: {e}")
    finally:
        connection.close()
        print("데이터베이스 연결 종료")

if __name__ == "__main__":
    main()