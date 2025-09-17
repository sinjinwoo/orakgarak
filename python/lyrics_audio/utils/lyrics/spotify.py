import os
import base64
import requests
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

# 1. Access Token 요청
auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}"
b64_auth_str = base64.b64encode(auth_str.encode()).decode()

token_url = "https://accounts.spotify.com/api/token"
headers = {
    "Authorization": f"Basic {b64_auth_str}",
    "Content-Type": "application/x-www-form-urlencoded"
}
data = {"grant_type": "client_credentials"}

res = requests.post(token_url, headers=headers, data=data)
access_token = res.json()["access_token"]

print("Access Token:", access_token)

# 2. 검색 API 사용 예시
search_url = "https://api.spotify.com/v1/search"
params = {
    "q": "Shape of You",
    "type": "track",
    "limit": 1
}
headers = {"Authorization": f"Bearer {access_token}"}

res = requests.get(search_url, headers=headers, params=params)
track = res.json()["tracks"]["items"][0]

print("Track Name:", track["name"])
print("Artist:", track["artists"][0]["name"])
print("Track ID:", track["id"])

# 앨범 커버 이미지들
images = track["album"]["images"]
for img in images:
    print(f"{img['width']}x{img['height']} : {img['url']}")

# 대표 이미지 (가장 큰 사이즈)
album_cover_url = images[0]["url"]
print("Album Cover URL:", album_cover_url)
