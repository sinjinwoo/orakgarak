#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import argparse
import json
import csv
from datetime import datetime
from utils.crawl.crawl import crawl_music_urls_with_lyrics_album
from utils.crawl.parsing import load_song_meta, create_enhanced_output_csv

def main():
    parser = argparse.ArgumentParser(description="음악 반주 URL 크롤링 도구")
    parser.add_argument(
        "--input",
        default="../song_meta.json",
        help="song_meta.json 파일 경로 (기본값: ../song_meta.json)"
    )
    parser.add_argument(
        "--output",
        default="music_urls.csv",
        help="출력 CSV 파일명 (기본값: music_urls.csv)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="처리할 노래 수 제한 (기본값: 전체)"
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="기존 CSV 파일에서 이어서 진행"
    )
    parser.add_argument(
        "--start-from",
        type=int,
        help="시작할 songid 지정"
    )

    args = parser.parse_args()

    start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"\n--- 크롤링 시작: {start_time} ---\n")

    try:
        # song_meta.json 로드 (이어서 진행할 때는 기존 CSV 확인)
        print("song_meta.json 파일 로딩 중...")
        resume_csv = args.output if args.resume else None
        songs = load_song_meta(args.input, args.limit, resume_csv)

        if not songs:
            print("처리할 노래가 없습니다. 모든 노래가 이미 처리되었거나 파일이 비어있습니다.")
            return 0

        print(f"총 {len(songs)}개 노래 로드됨")

        # 음악 URL + 가사/앨범 크롤링
        print("음악 반주 URL + 가사/앨범 정보 크롤링 시작...")
        results = crawl_music_urls_with_lyrics_album(songs, start_from_id=args.start_from)

        # CSV 파일로 저장 (가사/앨범 정보 포함)
        print(f"결과를 {args.output} 파일로 저장 중...")
        create_enhanced_output_csv(results, args.output, append_mode=args.resume)

        success_count = len([r for r in results if r.get('music_url')])
        print(f"성공: {success_count}/{len(results)}개 노래의 음악 URL 수집 완료")

        end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"\n--- 크롤링 종료: {end_time} ---\n")

        return 0

    except Exception as e:
        print(f"오류 발생: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())