# 장르 맵핑
from collections import Counter

# 톤 
tone_to_genres = {
    "선명하고 강렬한 톤": ["록/메탈", "댄스", "아이돌"],
    "밝고 또렷한 톤": ["인디음악", "댄스", "아이돌"],
    "가볍고 높은 톤": ["인디음악", "재즈", "R&B/Soul"],
    "부드럽고 맑은 톤": ["발라드", "포크/블루스", "재즈"],
    "무게감 있는 톤": ["발라드", "재즈", "성인가요"],
    "차분하고 포근한 톤": ["발라드", "재즈", "포크/블루스"],
    "안정적이고 힘 있는 톤": ["포크/블루스", "발라드", "재즈"],
    "따뜻하고 차분한 톤": ["포크/블루스", "발라드", "재즈"],
    "밝고 힘 있는 톤": ["댄스", "OST", "아이돌"],
    "맑고 선명한 톤": ["아이돌", "인디음악", "댄스"],
    "편안한 톤": ["인디음악", "포크/블루스", "발라드"]
}

# 음색
color_to_genres = {
    "울림이 큰 다채로운 음색": ["R&B/Soul", "일렉트로니카", "발라드"],
    "울림이 큰 안정적인 음색": ["OST", "발라드"],
    "편안하고 매력적인 음색": ["발라드", "R&B/Soul", "OST"],
    "자연스럽고 편안한 음색": ["발라드", "포크/블루스", "인디음악"],
    "편안하고 개성 있는 음색": ["인디음악", "포크/블루스", "R&B/Soul"],
    "담담하고 안정적인 음색": ["발라드", "인디음악", "포크/블루스"],
    "담백한 음색": ["포크/블루스", "발라드"]
}

# 분위기
mood_to_genres = {
    "차분하고 따뜻한 분위기": ["발라드", "재즈", "포크/블루스"],
    "묵직하고 드라마틱한 분위기": ["OST", "발라드","일렉트로니카"],
    "잔잔하고 안정적인 분위기": ["포크/블루스", "인디음악", "발라드"],
    "서정적이고 감성적인 분위기": ["발라드", "OST", "R&B/Soul", "포크/블루스"],
    "강렬하고 에너지 넘치는 분위기": ["아이돌", "록/메탈", "댄스"],
    "부드럽고 차분한 분위기": ["OST", "R&B/Soul", "발라드"],
    "밝고 힘 있는 분위기": ["인디음악", "아이돌", "댄스"],
    "맑고 산뜻한 분위기": ["인디음악"]
}

# 매핑 함수 -> 어울리는 장르 Top3 반환
def map_desc_to_genres(desc):
    # 각 desc별 장르 후보
    tone_genres, color_genres, mood_genres = [], [], []
    for d in desc:
        if d in tone_to_genres:
            tone_genres = tone_to_genres[d]
        if d in color_to_genres:
            color_genres = color_to_genres[d]
        if d in mood_to_genres:
            mood_genres = mood_to_genres[d]

    desc_to_genres = [tone_genres, color_genres, mood_genres]
    all_candidates = [g for sub in desc_to_genres if sub for g in sub]

    # 1) 교집합 찾기
    common = set(tone_genres) & set(color_genres) & set(mood_genres)

    if common:  # 교집합이 있으면 우선 사용
        result = list(common)
        # 나머지는 빈도 높은 순으로 채우기
        counter = Counter(all_candidates)
        for g, _ in counter.most_common():
            if g not in result:
                result.append(g)
            if len(result) >= 3:
                break
    else:  # 교집합이 없으면 분위기 기반 장르 반환
        result = mood_genres[:3]

    return result[:3]


# 테스트
if __name__ == "__main__":
    test_desc = ["밝고 또렷한 톤", "울림이 큰 안정적인 음색", "서정적이고 감성적인 분위기"]
    genres = map_desc_to_genres(test_desc)
    print("입력 desc:", test_desc)
    print("추천 장르 Top3:", genres)
