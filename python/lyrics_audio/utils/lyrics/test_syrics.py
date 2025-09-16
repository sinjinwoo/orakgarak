#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import base64
import requests
from syrics.api import Spotify
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

def get_spotify_access_token():
    """Spotify Access Token 획득"""
    CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

    if not CLIENT_ID or not CLIENT_SECRET:
        print("❌ SPOTIFY_CLIENT_ID 또는 SPOTIFY_CLIENT_SECRET이 .env에 설정되지 않았습니다")
        return None

    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()

    token_url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": f"Basic {b64_auth_str}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}

    try:
        res = requests.post(token_url, headers=headers, data=data)
        return res.json()["access_token"]
    except Exception as e:
        print(f"❌ Access Token 획득 실패: {e}")
        return None

def search_spotify_track(access_token, query):
    """Spotify에서 트랙 검색"""
    search_url = "https://api.spotify.com/v1/search"
    params = {
        "q": query,
        "type": "track",
        "limit": 1
    }
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        res = requests.get(search_url, headers=headers, params=params)
        tracks = res.json()["tracks"]["items"]

        if tracks:
            track = tracks[0]

            # 앨범 커버 이미지들 가져오기
            images = track["album"]["images"]
            album_cover_url = images[0]["url"] if images else None

            return {
                "id": track["id"],
                "name": track["name"],
                "artist": track["artists"][0]["name"],
                "album": track["album"]["name"],
                "album_cover_url": album_cover_url,
                "images": images
            }
        return None
    except Exception as e:
        print(f"❌ 트랙 검색 실패: {e}")
        return None

def test_syrics_search():
    """
    syrics로 가사 검색 테스트 (Spotify 검색 통합)
    """
    # sp_dc 쿠키 값
    sp_dc = os.getenv("SPOTIFY_SP_DC")

    # 테스트할 곡들
    test_songs = [
        "소주 한 잔 임창정",
        "Spring Day BTS",
        "밤편지 아이유"
    ]

    print("=== syrics + Spotify 검색 테스트 시작 ===\n")

    # 1. Spotify Access Token 획득
    access_token = get_spotify_access_token()
    if not access_token:
        return

    print("✅ Spotify Access Token 획득 성공")

    # 2. syrics 인스턴스 생성
    try:
        sp = Spotify(sp_dc)
        print("✅ syrics 인스턴스 생성 성공\n")
    except Exception as e:
        print(f"❌ syrics 인스턴스 생성 실패: {e}")
        return

    # 3. 각 곡에 대해 검색 및 가사 추출
    for i, song_query in enumerate(test_songs, 1):
        print(f"[{i}] 검색중: {song_query}")
        print("-" * 50)

        # Spotify에서 트랙 검색
        track_info = search_spotify_track(access_token, song_query)

        if not track_info:
            print("❌ Spotify에서 트랙을 찾을 수 없음")
            print("\n" + "="*60 + "\n")
            continue

        print(f"✅ Spotify 트랙 발견:")
        print(f"   제목: {track_info['name']}")
        print(f"   아티스트: {track_info['artist']}")
        print(f"   앨범: {track_info['album']}")
        print(f"   트랙 ID: {track_info['id']}")

        # 앨범 커버 이미지들
        if track_info['images']:
            print(f"   앨범 커버 이미지들:")
            for img in track_info['images']:
                print(f"     {img['width']}x{img['height']} : {img['url']}")
            print(f"   대표 이미지: {track_info['album_cover_url']}")
        else:
            print(f"   앨범 커버: 없음")
    
        # syrics로 가사 검색
        try:
            lyrics = sp.get_lyrics(track_info['id'])

            if lyrics:
                print("\n✅ 가사 발견:")
                lines = str(lyrics).split('\n')
                print(f"총 {len(lines)}줄")

                # 첫 5줄만 출력
                for idx, line in enumerate(lines[:5]):
                    if line.strip():
                        print(f"  {idx+1:2d}: {line}")

                if len(lines) > 5:
                    print("  ... (더 많은 가사 생략)")
            else:
                print("\n❌ 가사를 찾을 수 없음")

        except Exception as e:
            print(f"\n❌ 가사 검색 오류: {e}")

        print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    test_syrics_search()