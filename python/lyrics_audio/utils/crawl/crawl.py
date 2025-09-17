# -*- coding: utf-8 -*-
import requests
import time
import os
import base64
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import re
from difflib import SequenceMatcher
import html
from syrics.api import Spotify
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 브라우저 헤더
BROWSER_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
}

TIMEOUT = 10  # 요청 타임아웃(초)
SIMILARITY_THRESHOLD = 0.7  # 유사도 임계값 (0.6 이상이면 일치로 판단)

# 허용된 공식 채널 ID/이름
OFFICIAL_CHANNELS = [
    "TJ노래방",
    "tjkaraoke",
    "TJ Media",
    "금영노래방",
    "KumyoungKTV",
    "KUMYOUNG",
    "금영",
    "KY Karaoke"
]

def is_official_channel(channel_name: str) -> bool:
    """
    채널명이 공식 노래방 채널인지 확인

    Args:
        channel_name: 유튜브 채널명

    Returns:
        공식 채널이면 True, 아니면 False
    """
    if not channel_name:
        return False

    channel_name_lower = channel_name.lower().strip()

    for official in OFFICIAL_CHANNELS:
        if official.lower() in channel_name_lower:
            return True

    return False

def normalize_text(text: str) -> str:
    """
    텍스트 정규화 (공백, 특수문자 제거, 소문자 변환)
    """
    if not text:
        return ""

    # 특수문자 제거 및 소문자 변환
    normalized = re.sub(r'[^\w\s가-힣]', '', text.lower().strip())
    # 연속된 공백을 하나로
    normalized = re.sub(r'\s+', ' ', normalized)
    return normalized

def normalize_title_for_matching(title: str) -> str:
    """
    제목 매칭을 위한 정규화 (공백 제거 포함)
    """
    # Feat. 정보 제거
    title_clean = re.sub(r'\s*\(feat[^)]*\)', '', title, flags=re.IGNORECASE).strip()
    normalized = normalize_text(title_clean)
    # 공백도 제거해서 "잠시 길을 잃다" vs "잠시길을잃다" 매칭 가능
    return normalized.replace(' ', '')

def calculate_similarity(text1: str, text2: str) -> float:
    """
    두 텍스트 간의 유사도 계산 (0~1 사이 값)
    """
    norm1 = normalize_text(text1)
    norm2 = normalize_text(text2)

    if not norm1 or not norm2:
        return 0.0

    return SequenceMatcher(None, norm1, norm2).ratio()

def extract_song_title_from_video(video_title: str) -> str:
    """
    비디오 제목에서 실제 노래 제목만 추출
    예: "[TJ노래방] Girl Crush(이니시아네스트OST) - 마마무 / TJ Karaoke" -> "Girl Crush"
    """
    # 대괄호 제거
    title = re.sub(r'\[.*?\]', '', video_title).strip()

    # 채널명 제거 (/ 이후)
    title = re.split(r'/', title)[0].strip()

    # KY 번호 제거 (더 정확하게)
    title = re.sub(r'\s*\([^)]*KY\.\d+[^)]*\)', '', title).strip()

    # 하이픈으로 분리해서 제목만 추출 (단, 숫자-영문은 하나의 제목으로 처리)
    # 먼저 " - " (공백이 있는 하이픈)로 분리 시도
    if ' - ' in title:
        parts = title.split(' - ')
        if len(parts) >= 2:
            title = parts[0].strip()
    else:
        # 공백 없는 하이픈이지만 더 정교하게 분리
        # 숫자-문자 패턴은 제목으로 보고, 문자 - 문자 패턴만 분리
        parts = re.split(r'(?<=[가-힣a-zA-Z])\s*-\s*(?=[가-힣a-zA-Z])', title)
        if len(parts) >= 2:
            title = parts[0].strip()

    # 괄호 안의 추가 정보 제거 (OST, Feat, 드라마명, 영어 제목 등)
    title = re.sub(r'\([^)]*OST[^)]*\)', '', title).strip()
    title = re.sub(r'\([^)]*Feat[^)]*\)', '', title, flags=re.IGNORECASE).strip()
    title = re.sub(r'\([^)]*\bver\b[^)]*\)', '', title, flags=re.IGNORECASE).strip()
    title = re.sub(r'\([^)]*duet[^)]*\)', '', title, flags=re.IGNORECASE).strip()
    title = re.sub(r'\([^)]*드라마[^)]*\)', '', title).strip()
    title = re.sub(r'\([^)]*시트콤[^)]*\)', '', title).strip()

    # 영어 제목 제거 (Undelivered massage to you 같은)
    title = re.sub(r'\([^)]*[A-Z][a-z]+[^)]*\)', '', title).strip()

    return title.strip()

def extract_artist_from_video(video_title: str) -> str:
    """
    비디오 제목에서 아티스트명 추출
    예: "[TJ노래방] Girl Crush - 마마무 / TJ Karaoke" -> "마마무"
    """
    # 대괄호 제거
    title = re.sub(r'\[.*?\]', '', video_title).strip()

    # 채널명 제거 (/ 이후)
    title = re.split(r'/', title)[0].strip()

    # KY 번호 제거 (예: "(KY.88251)" )
    title = re.sub(r'\s*\([^)]*KY\.\d+[^)]*\)', '', title).strip()

    # 하이픈으로 분리해서 아티스트명 추출 (제목 추출과 같은 로직 사용)
    artist_part = ""
    if ' - ' in title:
        parts = title.split(' - ')
        if len(parts) >= 2:
            artist_part = parts[1].strip()
    else:
        # 정교한 하이픈 분리
        parts = re.split(r'(?<=[가-힣a-zA-Z])\s*-\s*(?=[가-힣a-zA-Z])', title)
        if len(parts) >= 2:
            artist_part = parts[1].strip()
        else:
            artist_part = title

    if artist_part:

        # 괄호 안의 영어명 등 제거
        # "이상은(Life Is a Journey - Lee Sang Eun)" -> "이상은"
        if '(' in artist_part:
            artist_part = artist_part.split('(')[0].strip()

        # 추가 정보 정리
        artist = re.sub(r'\([^)]*드라마[^)]*\)', '', artist_part).strip()
        artist = re.sub(r'\([^)]*duet[^)]*\)', '', artist, flags=re.IGNORECASE).strip()
        artist = re.sub(r'\([^)]*OST[^)]*\)', '', artist).strip()
        artist = re.sub(r'\([^)]*시트콤[^)]*\)', '', artist).strip()

        return artist.strip()

    return ""

def is_title_match(search_title: str, search_artist: str, video_title: str) -> bool:
    """
    검색한 노래와 비디오 제목이 일치하는지 확인 (제목과 아티스트를 분리해서 매칭)
    """
    # 비디오 제목에서 실제 노래 제목과 아티스트 추출
    extracted_title = extract_song_title_from_video(video_title)
    extracted_artist = extract_artist_from_video(video_title)

    # 검색어에서 불필요한 부분 제거
    # 제목에서 영어 부제목 제거 (Sleepless Night), (Duet Ver.) 등
    clean_search_title = re.sub(r'\s*\([^)]*[A-Za-z][^)]*\)', '', search_title).strip()
    # 아티스트에서 괄호 안 정보 제거 (샤이니), 쉼표를 공백으로
    clean_search_artist = re.sub(r'\s*\([^)]*\)', '', search_artist).strip().replace(',', ' ')
    clean_search_artist = re.sub(r'\s+', ' ', clean_search_artist)

    video_title_clean = normalize_text(extracted_title)
    video_artist_clean = normalize_text(extracted_artist)
    search_title_clean = normalize_text(clean_search_title)
    search_artist_clean = normalize_text(clean_search_artist)

    # 1. 제목 매칭 확인
    title_exact_match = search_title_clean == video_title_clean
    title_contains = search_title_clean in video_title_clean or video_title_clean in search_title_clean
    title_similarity = calculate_similarity(search_title_clean, video_title_clean)

    # 공백 제거 버전으로도 확인 ("잠시 길을 잃다" vs "잠시길을잃다")
    search_title_nospace = normalize_title_for_matching(clean_search_title)
    video_title_nospace = normalize_title_for_matching(extracted_title)
    title_nospace_match = search_title_nospace == video_title_nospace
    title_nospace_similarity = calculate_similarity(search_title_nospace, video_title_nospace)

    title_match = (title_exact_match or title_contains or title_similarity >= 0.8 or
                   title_nospace_match or title_nospace_similarity >= 0.8)

    # 2. 아티스트 매칭 확인 (추출된 아티스트와 비교)
    artist_match = True  # 기본값
    if search_artist_clean and video_artist_clean:
        # 정확한 아티스트 매칭
        artist_exact = search_artist_clean == video_artist_clean
        artist_contains = search_artist_clean in video_artist_clean or video_artist_clean in search_artist_clean
        artist_similarity = calculate_similarity(search_artist_clean, video_artist_clean)

        # 아티스트명을 정규화 전에 먼저 변형 확인
        search_artist_raw = search_artist.lower().strip()
        video_artist_raw = extracted_artist.lower().strip()

        # 기본 변형들 (정규화 전)
        raw_variations = [
            ('케이윌', 'k.will'), ('k.will', '케이윌'),
            ('먼데이 키즈', 'monday kiz'), ('monday kiz', '먼데이키즈'),
            ('나비', 'navi'), ('navi', '나비'),
            ('이상은', 'lee sang eun'),
            ('샤이니', 'shinee'), ('shinee', '샤이니'),
            ('바비 킴', 'bobby kim'), ('bobby kim', '바비 킴'),
            ('조pd', '조PD'), ('zopd', '조PD'),
            ('xia', '시아준수'), ('준수', '시아준수'),
            ('dok2', '도끼'), ('도끼', 'dok2'),
        ]

        # Raw 변형 매칭 확인
        raw_match = False
        for search_var, video_var in raw_variations:
            if ((search_var in search_artist_raw and video_var in video_artist_raw) or
                (video_var in search_artist_raw and search_var in video_artist_raw)):
                raw_match = True
                break

        # 기존 정규화된 변형들
        artist_variations = [
            search_artist_clean.replace('마마무', 'mamamoo'),
            search_artist_clean.replace('mamamoo', '마마무'),
            search_artist_clean.replace('세븐틴', 'seventeen'),
            search_artist_clean.replace('seventeen', '세븐틴'),
            search_artist_clean.replace('015b', '공일오비'),
            search_artist_clean.replace('공일오비', '015b'),
            search_artist_clean.replace('더 크로스', 'the cross'),
            search_artist_clean.replace('the cross', '더 크로스'),
            search_artist_clean.replace('(', '').replace(')', '').strip(),
            search_artist_clean.replace('the ', '').strip(),
            search_artist_clean.replace(' ', ''),  # 공백 제거
            search_artist_clean.replace(', ', ','),  # 쉼표 공백 제거
            re.sub(r'\(feat[^)]*\)', '', search_artist_clean, flags=re.IGNORECASE).strip(),
        ]

        # 원본 아티스트도 변형 확인
        video_artist_variations = [
            video_artist_clean.replace('seventeen', '세븐틴'),
            video_artist_clean.replace('세븐틴', 'seventeen'),
            video_artist_clean.replace('공일오비', '015b'),
            video_artist_clean.replace('015b', '공일오비'),
            video_artist_clean.replace('the cross', '더 크로스'),
            video_artist_clean.replace('더 크로스', 'the cross'),
            video_artist_clean.replace('(', '').replace(')', '').strip(),
            video_artist_clean.replace(' ', ''),  # 공백 제거
            video_artist_clean.replace(',', ', '),  # 쉼표에 공백 추가
            re.sub(r'\(feat[^)]*\)', '', video_artist_clean, flags=re.IGNORECASE).strip(),
        ]
        # 검색 아티스트의 변형이 비디오 아티스트와 매칭되는지 확인
        artist_variation_match1 = any(var == video_artist_clean or var in video_artist_clean for var in artist_variations if var)

        # 비디오 아티스트의 변형이 검색 아티스트와 매칭되는지 확인
        artist_variation_match2 = any(var == search_artist_clean or var in search_artist_clean for var in video_artist_variations if var)

        artist_match = (artist_exact or artist_contains or artist_similarity >= 0.7 or
                       artist_variation_match1 or artist_variation_match2 or raw_match)


    # 디버깅 정보 출력 (문제 케이스들)
    debug_keywords = ['삶은 여행', '이상은', 'love blossom', '케이윌', 'k will', 'cant stop loving you',
                     '먼데이 키즈', 'monday kiz', 'missing you', '나비', 'navi', 'ty dolla', 'mayday']

    if any(keyword in search_title_clean or keyword in search_artist_clean for keyword in debug_keywords):
        print(f"DEBUG - 원본 비디오: '{video_title}'")
        print(f"DEBUG - 추출된 제목: '{extracted_title}' vs 검색 제목: '{search_title}'")
        print(f"DEBUG - 추출된 아티스트: '{extracted_artist}' vs 검색 아티스트: '{search_artist}'")
        print(f"DEBUG - 제목 정규화: '{video_title_clean}' vs '{search_title_clean}'")
        print(f"DEBUG - 제목 공백제거: '{video_title_nospace}' vs '{search_title_nospace}'")
        print(f"DEBUG - 제목 매칭: {title_match}")
        print(f"DEBUG - 아티스트 매칭: {artist_match}")
        if search_artist_clean and video_artist_clean:
            artist_similarity = calculate_similarity(search_artist_clean, video_artist_clean)
            print(f"DEBUG - 아티스트 유사도: {artist_similarity:.2f}")
        print("---")

    # 제목과 아티스트 모두 매칭되어야 함
    return title_match and artist_match

def search_music_url(song_name: str, artist_name: str) -> str:
    """
    노래 제목과 아티스트명으로 음악 반주 URL 검색 (공식 채널만)

    Args:
        song_name: 노래 제목
        artist_name: 아티스트명

    Returns:
        음악 반주 URL (공식 채널에서 찾지 못하면 빈 문자열)
    """
    try:
        # 검색 쿼리 생성 (노래방 키워드 강화)
        query = f'"{song_name}" "{artist_name}" 노래방'
        search_url = f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}"


        response = requests.get(search_url, headers=BROWSER_HEADERS, timeout=TIMEOUT)
        response.raise_for_status()

        # YouTube 검색 결과 페이지에서 비디오 정보 추출
        content = response.text

        # 정규식으로 비디오 데이터 추출
        video_pattern = r'"videoRenderer":\{"videoId":"([^"]+)".*?"title":\{"runs":\[\{"text":"([^"]+)"\}\].*?"ownerText":\{"runs":\[\{"text":"([^"]+)"'
        matches = re.findall(video_pattern, content)

        for video_id, title, channel_name in matches:
            # HTML 엔티티 디코딩
            title = html.unescape(title)
            channel_name = html.unescape(channel_name)

            # 공식 채널인지 확인
            if is_official_channel(channel_name):
                # 제목 일치도 확인
                if is_title_match(song_name, artist_name, title):
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    print(f"일치하는 곡 발견: {channel_name} - {extract_song_title_from_video(title)}")
                    return video_url

        print(f"일치하는 곡을 공식 채널에서 찾을 수 없음: {html.unescape(song_name)} - {html.unescape(artist_name)}")
        return ""

    except Exception as e:
        print(f"URL 검색 중 오류 발생 ({song_name} - {artist_name}): {str(e)}")
        return ""

def crawl_music_urls(songs: List[Dict[str, Any]], batch_size: int = 1000) -> List[Dict[str, Any]]:
    """
    노래 리스트에서 각 노래의 음악 반주 URL을 크롤링 (공식 채널만)

    Args:
        songs: 노래 정보 리스트
        batch_size: 배치 크기 (기본 1000곡)

    Returns:
        URL이 추가된 노래 정보 리스트
    """
    from .parsing import save_batch_csv

    all_results = []
    total = len(songs)
    batch_num = 1

    for batch_start in range(0, total, batch_size):
        batch_end = min(batch_start + batch_size, total)
        batch_songs = songs[batch_start:batch_end]
        batch_results = []

        print(f"\n=== 배치 {batch_num} 시작 ({batch_start + 1}~{batch_end}/{total}) ===")

        for i, song in enumerate(batch_songs, 1):
            song_name = song.get('song_name', '')
            artist_names = song.get('artist_name_basket', [])
            artist_name = artist_names[0] if artist_names else ''
            current_pos = batch_start + i

            # 간단한 진행률 출력 (매 100곡마다)
            if i % 100 == 0 or i == len(batch_songs):
                print(f"진행률: {current_pos}/{total} ({current_pos/total*100:.1f}%)")

            # 음악 URL 검색 (공식 채널만)
            music_url = search_music_url(song_name, artist_name)

            # 결과 생성
            result = song.copy()
            result['music_url'] = music_url
            result['status'] = 'success' if music_url else 'failed'
            result['source'] = 'official_channel' if music_url else 'not_found'

            batch_results.append(result)
            all_results.append(result)

            # 요청 간격 (서버 과부하 방지)
            time.sleep(1)

        # 배치 완료 시 CSV 저장
        saved_file = save_batch_csv(batch_results, batch_num)
        success_count = len([r for r in batch_results if r.get('music_url')])
        print(f"배치 {batch_num} 완료: {success_count}/{len(batch_results)}개 성공, {saved_file} 저장됨")

        batch_num += 1

    return all_results

def get_spotify_access_token() -> Optional[str]:
    """Spotify Access Token 획득"""
    CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

    if not CLIENT_ID or not CLIENT_SECRET:
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
        res = requests.post(token_url, headers=headers, data=data, timeout=TIMEOUT)
        res.raise_for_status()
        return res.json()["access_token"]
    except Exception as e:
        print(f"Spotify 토큰 획득 실패: {str(e)}")
        return None

def search_spotify_track(access_token: str, query: str) -> Optional[Dict[str, Any]]:
    """Spotify에서 트랙 검색"""
    search_url = "https://api.spotify.com/v1/search"
    params = {"q": query, "type": "track", "limit": 1}
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        res = requests.get(search_url, headers=headers, params=params, timeout=TIMEOUT)
        res.raise_for_status()

        response_data = res.json()
        tracks = response_data["tracks"]["items"]

        if tracks:
            track = tracks[0]
            images = track["album"]["images"]
            album_cover_url = images[0]["url"] if images else None

            return {
                "id": track["id"],
                "name": track["name"],
                "artist": track["artists"][0]["name"],
                "album": track["album"]["name"],
                "album_cover_url": album_cover_url,
                "duration_ms": track["duration_ms"],
                "popularity": track["popularity"]
            }
        return None
    except requests.exceptions.HTTPError as e:
        if res.status_code == 401:
            print(f"Spotify 토큰이 만료되었습니다: {str(e)}")
            return "TOKEN_EXPIRED"
        print(f"Spotify API 요청 실패: {str(e)}")
        return None
    except Exception as e:
        print(f"Spotify 트랙 검색 중 오류: {str(e)}")
        return None

def get_lyrics_from_spotify(sp_dc: str, track_id: str) -> Optional[str]:
    """syrics를 사용해서 Spotify에서 가사 가져오기"""
    try:
        sp = Spotify(sp_dc)
        lyrics = sp.get_lyrics(track_id)
        return str(lyrics) if lyrics else None
    except:
        return None

def crawl_music_urls_with_lyrics_album(songs: List[Dict[str, Any]], start_from_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    음악 반주 URL + 가사/앨범 정보를 함께 크롤링

    Args:
        songs: 노래 정보 리스트
        start_from_id: 시작할 songid (None이면 처음부터)
    """
    from .parsing import save_batch_csv

    # 시작 지점 찾기
    if start_from_id is not None:
        start_index = None
        for i, song in enumerate(songs):
            if song.get('id') == start_from_id:
                start_index = i
                break

        if start_index is not None:
            songs = songs[start_index:]
            print(f"🎯 songid {start_from_id}부터 시작 (전체 {len(songs)}개 곡 처리 예정)")
        else:
            print(f"⚠️  songid {start_from_id}를 찾을 수 없습니다. 처음부터 시작합니다.")

    # Spotify 설정
    sp_dc = os.getenv("SPOTIFY_SP_DC")
    if not sp_dc:
        print("⚠️  SPOTIFY_SP_DC가 .env에 설정되지 않았습니다 - 가사 수집 불가")
        access_token = None
    else:
        access_token = get_spotify_access_token()

    if access_token and sp_dc:
        print("✅ Spotify 연동 준비 완료")
    else:
        print("⚠️  Spotify 연동 실패 - 가사/앨범 정보 없이 진행")

    all_results = []
    batch_size = 1000
    batch_num = 1
    token_retry_count = 0
    max_token_retries = 3

    for i in range(0, len(songs), batch_size):
        batch_songs = songs[i:i + batch_size]
        batch_results = []

        print(f"\n배치 {batch_num} 시작: {len(batch_songs)}개 곡 처리")

        for j, song in enumerate(batch_songs):
            song_name = song.get('song_name', '')
            artist_name_basket = song.get('artist_name_basket', '')

            # 아티스트명 처리
            if isinstance(artist_name_basket, list):
                artist_name = ', '.join(artist_name_basket)
            else:
                artist_name = str(artist_name_basket) if artist_name_basket else ''

            print(f"  [{j+1}/{len(batch_songs)}] {song_name} - {artist_name}")

            # 1. YouTube URL 검색
            music_url = search_music_url(song_name, artist_name)

            # 기본 결과 생성
            result = song.copy()
            result['music_url'] = music_url
            result['status'] = 'success' if music_url else 'failed'
            result['source'] = 'official_channel' if music_url else 'not_found'
            result['lyrics'] = None
            result['album_cover_url'] = None
            result['spotify_track_id'] = None
            result['album_name'] = None
            result['duration_ms'] = None
            result['popularity'] = None

            # 2. YouTube URL이 있고 Spotify 연동이 가능하면 가사/앨범 정보 수집
            if music_url and access_token and sp_dc:
                # 한국어 우선 검색을 위해 여러 검색 쿼리 시도
                search_queries = [
                    f"{song_name} {artist_name}",  # 기본 검색
                    f"{artist_name} {song_name}",  # 아티스트 우선
                    song_name  # 제목만
                ]

                track_info = None
                for query in search_queries:
                    if query.strip():
                        track_info = search_spotify_track(access_token, query.strip())

                        # 토큰 만료 처리
                        if track_info == "TOKEN_EXPIRED" and token_retry_count < max_token_retries:
                            print(f"    🔄 토큰 만료 감지, 재발급 시도 ({token_retry_count + 1}/{max_token_retries})")
                            access_token = get_spotify_access_token()

                            if access_token:
                                print("    ✅ 새 토큰 발급 성공, 재시도 중...")
                                track_info = search_spotify_track(access_token, query.strip())
                                token_retry_count += 1
                            else:
                                print("    ❌ 토큰 재발급 실패")
                                access_token = None
                                break
                        elif track_info == "TOKEN_EXPIRED":
                            print(f"    ❌ 토큰 재발급 최대 시도 횟수 초과 ({max_token_retries}회)")
                            access_token = None
                            break

                        if track_info and track_info != "TOKEN_EXPIRED":
                            print(f"    ✅ Spotify: {track_info['name']} - {track_info['artist']}")
                            break

                if track_info and track_info != "TOKEN_EXPIRED":
                    result['spotify_track_id'] = track_info['id']
                    result['album_cover_url'] = track_info['album_cover_url']
                    result['album_name'] = track_info['album']
                    result['duration_ms'] = track_info['duration_ms']
                    result['popularity'] = track_info['popularity']

                    # 가사 가져오기
                    lyrics = get_lyrics_from_spotify(sp_dc, track_info['id'])
                    if lyrics:
                        result['lyrics'] = lyrics
                        print(f"    ✅ 가사 수집 성공 (길이: {len(lyrics)} 문자)")
                    else:
                        print(f"    ❌ 가사 없음")
                elif access_token:
                    print(f"    ❌ Spotify에서 트랙 없음")

            batch_results.append(result)
            all_results.append(result)

            # 요청 간격
            time.sleep(1)

        # 배치 완료 시 CSV 저장
        saved_file = save_batch_csv(batch_results, batch_num, "enhanced_music_urls")
        success_count = len([r for r in batch_results if r.get('music_url')])
        lyrics_count = len([r for r in batch_results if r.get('lyrics')])
        print(f"배치 {batch_num} 완료: URL {success_count}/{len(batch_results)}개, 가사 {lyrics_count}개, {saved_file} 저장됨")

        batch_num += 1

    return all_results