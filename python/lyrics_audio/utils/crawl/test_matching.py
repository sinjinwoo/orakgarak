#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
sys.path.append('utils')

from crawl_debug import is_title_match, normalize_text, normalize_title_for_matching

def test_matching_cases():
    """
    매칭 실패 케이스들 테스트
    """
    test_cases = [
        {
            "search_title": "Party On!",
            "search_artist": "조pd (ZoPD)",
            "video_title": "[TJ노래방] Party On - 조PD / TJ Karaoke"
        },
        {
            "search_title": "How Can I Love You",
            "search_artist": "XIA (준수)",
            "video_title": "[TJ노래방] How Can I Love You(태양의후예OST) - 시아준수 / TJ Karaoke"
        },
        {
            "search_title": "1llusion",
            "search_artist": "Dok2",
            "video_title": "[TJ노래방] 1llusion - 도끼 / TJ Karaoke"
        }
    ]

    print("=== 매칭 실패 케이스 테스트 ===\n")

    for i, case in enumerate(test_cases, 1):
        print(f"[{i}] 테스트 케이스")
        print(f"검색 제목: '{case['search_title']}'")
        print(f"검색 아티스트: '{case['search_artist']}'")
        print(f"비디오 제목: '{case['video_title']}'")
        print("-" * 70)

        # 정규화 테스트
        search_title_norm = normalize_text(case['search_title'])
        search_artist_norm = normalize_text(case['search_artist'])

        print(f"정규화된 검색 제목: '{search_title_norm}'")
        print(f"정규화된 검색 아티스트: '{search_artist_norm}'")

        # 공백 제거 정규화
        search_title_nospace = normalize_title_for_matching(case['search_title'])

        print(f"공백제거 검색 제목: '{search_title_nospace}'")

        # 매칭 테스트
        is_match = is_title_match(
            case['search_title'],
            case['search_artist'],
            case['video_title']
        )

        result = "✅ 매칭 성공" if is_match else "❌ 매칭 실패"
        print(f"\n{result}")

        print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    test_matching_cases()