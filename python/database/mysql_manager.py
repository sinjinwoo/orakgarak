# -*- coding: utf-8 -*-
import mysql.connector
import os
import logging
from typing import List, Optional
from mysql.connector import Error
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

class MySQLManager:
    def __init__(self):
        self.connection = None
        self.host = os.getenv("DB_HOST", "localhost")
        self.port = int(os.getenv("DB_PORT", 3306))
        self.database = os.getenv("DB_NAME", "orakgaraki")
        self.username = os.getenv("DB_USERNAME", "orakgaraki")
        self.password = os.getenv("DB_PASSWORD", "")

    def connect(self) -> bool:
        """MySQL 데이터베이스 연결"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.username,
                password=self.password,
                charset='utf8mb4',
                collation='utf8mb4_unicode_ci'
            )

            if self.connection.is_connected():
                logging.info(f"MySQL 연결 성공: {self.database}")
                return True
            else:
                logging.error("MySQL 연결 실패")
                return False

        except Error as e:
            logging.error(f"MySQL 연결 오류: {e}")
            return False

    def disconnect(self):
        """MySQL 연결 해제"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            logging.info("MySQL 연결 해제")

    def get_user_disliked_songs(self, user_id: int) -> List[int]:
        """사용자가 싫어요한 song_id 목록 조회"""
        try:
            if not self.connection or not self.connection.is_connected():
                if not self.connect():
                    return []

            cursor = self.connection.cursor()
            query = "SELECT song_id FROM dislikes WHERE user_id = %s"
            cursor.execute(query, (user_id,))
            result = cursor.fetchall()
            cursor.close()

            return [row[0] for row in result]

        except Error as e:
            logging.error(f"사용자 dislike 조회 오류: {e}")
            return []

    def is_disliked(self, user_id: int, song_id: int) -> bool:
        """특정 곡이 사용자에 의해 dislike 되었는지 확인"""
        try:
            if not self.connection or not self.connection.is_connected():
                if not self.connect():
                    return False

            cursor = self.connection.cursor()
            query = "SELECT 1 FROM dislikes WHERE user_id = %s AND song_id = %s"
            cursor.execute(query, (user_id, song_id))
            result = cursor.fetchone()
            cursor.close()

            return result is not None

        except Error as e:
            logging.error(f"dislike 확인 오류: {e}")
            return False