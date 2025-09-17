# Syrics 사용법 정리

## 라이브러리 개요
- Spotify 기반 가사 검색 라이브러리
- 동기화된 가사(LRC) 및 일반 가사 지원
- Spotify 계정 및 sp_dc 쿠키 필요

## 설치
```bash
pip install syrics
# 업그레이드
pip install syrics --upgrade
```

## 설정 방법
1. Spotify 계정 필요 (프리미엄 권장)
2. sp_dc 쿠키 값 획득 필요
3. 설정 명령어: `syrics --config`

## 사용 방법

### 1. 명령줄 사용
```bash
# 대화형 모드
syrics

# 직접 URL 입력
syrics https://open.spotify.com/track/[track_id]

# 다운로드 디렉토리 지정
syrics --directory ~/Music/songs/ [track_url]

# 현재 재생 중인 곡
syrics --user current-playing

# 플레이리스트 다운로드
syrics --user playlist


### 2. Python 모듈 사용
from syrics.api import Spotify

# sp_dc 쿠키 값으로 인스턴스 생성
sp = Spotify("BQDqyw5ww6xB66w04Npe0TlwoyMC40DgcBiuC5L6joYhvPoFA66e7G_5BkNfAsARAaOMCTxd1kIU_tRTdDQwk0SOW_-q9NQ--wpmDJTfaGhTGsccwv8-XhI8vwc1S4p7QAOEA91u5LuPkP8YoiPo13mJqrdomjEOjRd5YOcmiYjrmnElaT2PyIrmiWWjKzl22RY5rFGfOOLbaD9HtfPoC18BqsNOZOLN3HV3NEg-4F-k7vfI5gxLLK5bLf0CR7CsHe7APpmBmQE6JFqVYqOjEc2kXU60HHeVdo5lgzebiUm0j1La-zy0cYAJGDrMcvEiT4V8aihsuwLkKSOaKzQ2tWghR56_NndRsdWZ28Hl_fSLuyMr_kTFaSrD21o7l7CApQ")

# 가사 가져오기
lyrics = sp.get_lyrics("")
```

## 설정 파일 구조
```json
{
    "sp_dc": "",
    "download_path": "downloads",
    "create_folder": true,
    "synced_lyrics": true
}
```

## 주요 기능
- 동기화된 가사 (시간 정보 포함)
- 일반 가사
- 트랙, 플레이리스트 지원
- 사용자 정의 다운로드 경로

## 제한사항
- Spotify 계정 필요
- sp_dc 쿠키 획득 및 설정 필요
- Spotify에 등록된 곡만 검색 가능

## 대안 방법
sp_dc 쿠키 설정이 복잡한 경우, syncedlyrics 라이브러리 사용 권장:
```python
import syncedlyrics
lyrics = syncedlyrics.search("song_name artist", enhanced=False)
```