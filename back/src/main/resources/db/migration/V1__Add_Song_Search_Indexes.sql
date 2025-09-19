-- 실시간 검색 성능 최적화를 위한 인덱스 추가

-- 노래 제목 검색용 인덱스
CREATE INDEX idx_songs_song_name ON songs(song_name);

-- 아티스트명 검색용 인덱스
CREATE INDEX idx_songs_artist_name ON songs(artist_name);

-- 복합 검색용 인덱스 (상태 + 인기도 정렬)
CREATE INDEX idx_songs_status_popularity ON songs(status, popularity DESC);

-- 전체 텍스트 검색 최적화를 위한 복합 인덱스
CREATE INDEX idx_songs_search_optimization ON songs(song_name, artist_name, status, popularity DESC);