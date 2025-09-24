# -*- coding: utf-8 -*-
import pandas as pd
import pymysql as mysql
import json
import os
import glob
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

def create_songs_table(connection):
    """songs 테이블 생성"""
    cursor = connection.cursor()

    create_table_query = """
    CREATE TABLE IF NOT EXISTS songs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        song_id BIGINT UNIQUE NOT NULL,
        song_name VARCHAR(500) NOT NULL,
        artist_name VARCHAR(500),
        album_name VARCHAR(500),
        music_url TEXT,
        lyrics LONGTEXT,
        album_cover_url TEXT,
        spotify_track_id VARCHAR(100),
        duration_ms INT,
        popularity INT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    """

    try:
        cursor.execute(create_table_query)
        connection.commit()
        print("songs 테이블 생성 완료")
    except mysql.Error as e:
        print(f"테이블 생성 오류: {e}")
    finally:
        cursor.close()

def parse_lyrics(lyrics_str):
    """가사 JSON 문자열을 파싱하여 텍스트로 변환"""
    if not lyrics_str or lyrics_str.strip() == '':
        return None

    try:
        lyrics_data = json.loads(lyrics_str)
        if 'lyrics' in lyrics_data and 'lines' in lyrics_data['lyrics']:
            lines = lyrics_data['lyrics']['lines']
            lyrics_text = '\n'.join([line['words'] for line in lines if line.get('words', '').strip()])
            return lyrics_text if lyrics_text.strip() else None
    except (json.JSONDecodeError, KeyError, TypeError):
        # JSON 파싱 실패시 원본 반환
        return lyrics_str if lyrics_str.strip() else None

    return None

def insert_songs_batch(connection, songs_data):
    """배치로 곡 데이터 삽입"""
    cursor = connection.cursor()

    insert_query = """
    INSERT INTO songs (
        song_id, song_name, artist_name, album_name, music_url,
        lyrics, album_cover_url, spotify_track_id, duration_ms,
        popularity, status, created_at, updated_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        song_name = VALUES(song_name),
        artist_name = VALUES(artist_name),
        album_name = VALUES(album_name),
        music_url = VALUES(music_url),
        lyrics = VALUES(lyrics),
        album_cover_url = VALUES(album_cover_url),
        spotify_track_id = VALUES(spotify_track_id),
        duration_ms = VALUES(duration_ms),
        popularity = VALUES(popularity),
        status = VALUES(status),
        updated_at = NOW()
    """

    try:
        cursor.executemany(insert_query, songs_data)
        connection.commit()
        print(f"{len(songs_data)}개 곡 데이터 삽입/업데이트 완료")
        return cursor.rowcount
    except mysql.Error as e:
        print(f"데이터 삽입 오류: {e}")
        connection.rollback()
        return 0
    finally:
        cursor.close()

def process_csv_file(csv_path):
    """CSV 파일 처리 및 가사가 있는 곡만 필터링"""
    print(f"CSV 파일 로드 중: {csv_path}")

    try:
        # CSV 읽기
        df = pd.read_csv(csv_path, encoding='utf-8')
        print(f"전체 곡 수: {len(df)}")

        # 성공한 곡만 필터링
        success_df = df[df['status'] == 'success'].copy()
        print(f"성공한 곡 수: {len(success_df)}")

        # 가사가 있는 곡만 필터링
        lyrics_df = success_df[
            success_df['lyrics'].notna() &
            (success_df['lyrics'].str.strip() != '') &
            (success_df['lyrics'] != '{}')
        ].copy()
        print(f"가사가 있는 곡 수: {len(lyrics_df)}")

        if len(lyrics_df) == 0:
            print("가사가 있는 곡이 없습니다.")
            return []

        # 데이터 준비
        songs_data = []
        for _, row in lyrics_df.iterrows():
            lyrics_text = parse_lyrics(row['lyrics'])
            if lyrics_text:  # 파싱된 가사가 있는 경우만
                song_data = (
                    int(row['songid']),  # song_id
                    str(row['song_name'])[:500],  # song_name (길이 제한)
                    str(row['artist_name_basket'])[:500] if pd.notna(row['artist_name_basket']) else None,  # artist_name
                    str(row['album_name'])[:500] if pd.notna(row['album_name']) else None,  # album_name
                    str(row['music_url']) if pd.notna(row['music_url']) else None,  # music_url
                    lyrics_text,  # lyrics
                    str(row['album_cover_url']) if pd.notna(row['album_cover_url']) else None,  # album_cover_url
                    str(row['spotify_track_id']) if pd.notna(row['spotify_track_id']) else None,  # spotify_track_id
                    int(float(row['duration_ms'])) if pd.notna(row['duration_ms']) and str(row['duration_ms']).strip() != '' and str(row['duration_ms']).replace('.', '').replace('-', '').isdigit() else None,  # duration_ms
                    int(float(row['popularity'])) if pd.notna(row['popularity']) and str(row['popularity']).strip() != '' and str(row['popularity']).replace('.', '').replace('-', '').isdigit() else None,  # popularity
                    str(row['status'])  # status
                )
                songs_data.append(song_data)

        print(f"DB 삽입 대상 곡 수: {len(songs_data)}")
        return songs_data

    except Exception as e:
        print(f"CSV 처리 오류: {e}")
        return []

def find_csv_files():
    """프로젝트 내에서 가사 데이터가 포함된 CSV 파일들을 자동으로 찾기"""
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

    # 찾을 패턴들
    search_patterns = [
        os.path.join(project_root, "**/*.csv"),
    ]

    found_files = []
    for pattern in search_patterns:
        files = glob.glob(pattern, recursive=True)
        found_files.extend(files)

    # 중복 제거
    found_files = list(set(found_files))

    # 가사 데이터가 있을 것 같은 파일들 필터링
    lyrics_csv_files = []
    for file_path in found_files:
        try:
            # 파일명에 가사 관련 키워드가 있거나
            filename = os.path.basename(file_path).lower()
            if any(keyword in filename for keyword in ['lyrics', 'music', 'song', 'enhanced', 'batch']):
                lyrics_csv_files.append(file_path)
                continue

            # 실제로 파일을 열어서 lyrics 컬럼이 있는지 확인
            df_sample = pd.read_csv(file_path, nrows=1)
            if 'lyrics' in df_sample.columns and 'status' in df_sample.columns:
                lyrics_csv_files.append(file_path)
        except Exception:
            # 파일 읽기 실패시 무시
            continue

    return lyrics_csv_files

def main():
    """메인 실행 함수"""
    print("=== CSV 파일 자동 검색 중 ===")
    csv_files = find_csv_files()

    if not csv_files:
        print("가사 데이터가 포함된 CSV 파일을 찾을 수 없습니다.")
        print("다음 위치에 CSV 파일을 배치해주세요:")
        print("- 프로젝트 루트 디렉토리")
        print("- python/data/ 디렉토리")
        print("- python/lyrics_audio/ 디렉토리")
        return

    print(f"발견된 CSV 파일들:")
    for i, file_path in enumerate(csv_files, 1):
        print(f"{i}. {file_path}")
    print()

    # 데이터베이스 연결
    connection = connect_to_db()
    if not connection:
        print("데이터베이스 연결 실패")
        return

    try:
        # 테이블 생성
        create_songs_table(connection)

        total_inserted = 0

        # 각 CSV 파일 처리
        for csv_path in csv_files:
            if os.path.exists(csv_path):
                print(f"\n=== {csv_path} 처리 시작 ===")
                songs_data = process_csv_file(csv_path)

                if songs_data:
                    # 배치 크기로 나누어 삽입 (메모리 효율성)
                    batch_size = 100
                    for i in range(0, len(songs_data), batch_size):
                        batch = songs_data[i:i + batch_size]
                        inserted = insert_songs_batch(connection, batch)
                        total_inserted += inserted
                        print(f"배치 {i//batch_size + 1} 완료")

                print(f"=== {csv_path} 처리 완료 ===")
            else:
                print(f"파일을 찾을 수 없습니다: {csv_path}")

        print(f"\n총 {total_inserted}개 곡 데이터가 DB에 저장되었습니다.")

    except Exception as e:
        print(f"실행 중 오류 발생: {e}")
    finally:
        connection.close()
        print("데이터베이스 연결 종료")

if __name__ == "__main__":
    main()