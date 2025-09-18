# -*- coding: utf-8 -*-
import pymysql as mysql
import os
from dotenv import load_dotenv

# 환경변수 로드
load_dotenv()

def connect_to_db():
    """MySQL 데이터베이스 연결"""
    try:
        connection = mysql.connect(
            host=os.getenv('DB_HOST_LOCAL', 'localhost'),
            port=int(os.getenv('DB_PORT_LOCAL', '3306')),
            user=os.getenv('DB_USERNAME_LOCAL', 'ssafy'),
            password=os.getenv('DB_PASSWORD_LOCAL', 'ssafy'),
            database=os.getenv('DB_NAME_LOCAL', 'orakgaraki'),
            charset='utf8mb4'
        )
        return connection
    except mysql.Error as e:
        print(f"데이터베이스 연결 오류: {e}")
        return None

def escape_sql_string(text):
    """SQL 문자열 이스케이프"""
    if text is None:
        return 'NULL'

    # 작은따옴표를 두 개로 변경하여 이스케이프
    escaped = text.replace("'", "''").replace("\\", "\\\\")
    return f"'{escaped}'"

def generate_data_sql():
    """DB에서 songs 데이터를 읽어서 data.sql 생성"""
    connection = connect_to_db()
    if not connection:
        print("DB 연결 실패")
        return

    try:
        cursor = connection.cursor()

        # songs 테이블에서 모든 데이터 조회
        query = """
        SELECT song_id, song_name, artist_name, album_name, music_url,
               lyrics, album_cover_url, spotify_track_id, duration_ms,
               popularity, status
        FROM songs
        ORDER BY song_id
        """

        cursor.execute(query)
        songs = cursor.fetchall()

        if not songs:
            print("DB에 songs 데이터가 없습니다. 먼저 import_lyrics_to_db.py를 실행하세요.")
            return

        print(f"DB에서 {len(songs)}개 곡 데이터를 찾았습니다.")

        # data.sql 파일 생성
        data_sql_path = "../../back/src/main/resources/data.sql"
        os.makedirs(os.path.dirname(data_sql_path), exist_ok=True)

        with open(data_sql_path, 'w', encoding='utf-8') as f:
            f.write("-- 곡 데이터 초기 삽입 (자동 생성)\n")
            f.write("-- 이 파일은 generate_data_sql.py에 의해 생성되었습니다.\n\n")

            # 배치 크기로 나누어 INSERT 문 생성
            batch_size = 50
            for i in range(0, len(songs), batch_size):
                batch = songs[i:i + batch_size]

                f.write("INSERT IGNORE INTO songs (song_id, song_name, artist_name, album_name, music_url, lyrics, album_cover_url, spotify_track_id, duration_ms, popularity, status) VALUES\n")

                for j, song in enumerate(batch):
                    song_id, song_name, artist_name, album_name, music_url, lyrics, album_cover_url, spotify_track_id, duration_ms, popularity, status = song

                    values = [
                        str(song_id),
                        escape_sql_string(song_name),
                        escape_sql_string(artist_name),
                        escape_sql_string(album_name),
                        escape_sql_string(music_url),
                        escape_sql_string(lyrics),
                        escape_sql_string(album_cover_url),
                        escape_sql_string(spotify_track_id),
                        str(duration_ms) if duration_ms is not None else 'NULL',
                        str(popularity) if popularity is not None else 'NULL',
                        escape_sql_string(status)
                    ]

                    line = f"({', '.join(values)})"
                    if j < len(batch) - 1:
                        line += ","
                    else:
                        line += ";"

                    f.write(line + "\n")

                f.write("\n")

        print(f"data.sql 파일이 생성되었습니다: {data_sql_path}")
        print(f"총 {len(songs)}개 곡 데이터가 포함되었습니다.")

    except Exception as e:
        print(f"오류 발생: {e}")
    finally:
        cursor.close()
        connection.close()

if __name__ == "__main__":
    generate_data_sql()