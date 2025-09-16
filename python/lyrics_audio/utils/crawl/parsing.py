# -*- coding: utf-8 -*-
import json
import csv
import os
from typing import List, Dict, Any

def load_song_meta(file_path: str, limit: int = None, resume_from_csv: str = None) -> List[Dict[str, Any]]:
    """
    song_meta.json 파일을 로드하고 처리할 노래 리스트를 반환
    기존 CSV 파일이 있으면 처리된 곡들을 제외하고 이어서 진행

    Args:
        file_path: song_meta.json 파일 경로
        limit: 처리할 노래 수 제한 (None이면 전체)
        resume_from_csv: 기존 CSV 파일 경로 (이어서 진행할 때)

    Returns:
        노래 정보 리스트
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            songs = json.load(f)

        # 기존 CSV에서 이미 처리된 songid들 확인
        processed_ids = set()
        if resume_from_csv and os.path.exists(resume_from_csv):
            print(f"기존 CSV 파일 발견: {resume_from_csv}")
            try:
                with open(resume_from_csv, 'r', encoding='utf-8-sig') as csvfile:
                    reader = csv.DictReader(csvfile)
                    for row in reader:
                        # 기존 CSV가 'id' 컬럼을 사용하는 경우와 'songid' 컬럼을 사용하는 경우 모두 처리
                        song_id = row.get('songid') or row.get('id')
                        if song_id:
                            processed_ids.add(int(song_id))
                print(f"이미 처리된 노래: {len(processed_ids)}개")
            except Exception as e:
                print(f"기존 CSV 읽기 실패: {e}")

        # 이미 처리된 곡들 제외
        if processed_ids:
            original_count = len(songs)
            songs = [song for song in songs if song.get('id') not in processed_ids]
            print(f"전체 {original_count}개 중 {len(songs)}개 남음 (이미 처리된 {original_count - len(songs)}개 제외)")

        if limit:
            songs = songs[:limit]

        return songs

    except FileNotFoundError:
        raise Exception(f"파일을 찾을 수 없습니다: {file_path}")
    except json.JSONDecodeError:
        raise Exception(f"JSON 파일 형식이 올바르지 않습니다: {file_path}")

def create_output_csv(results: List[Dict[str, Any]], output_file: str):
    """
    크롤링 결과를 CSV 파일로 저장

    Args:
        results: 크롤링 결과 리스트
        output_file: 출력 파일명
    """
    fieldnames = ['id', 'song_name', 'artist_name_basket', 'music_url', 'status']

    # UTF-8 BOM을 추가해서 엑셀에서도 제대로 읽히도록 함
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for result in results:
            writer.writerow({
                'id': result.get('id'),
                'song_name': result.get('song_name'),
                'artist_name_basket': ', '.join(result.get('artist_name_basket', [])) if result.get('artist_name_basket') else '',
                'music_url': result.get('music_url', ''),
                'status': result.get('status', 'failed')
            })

    print(f"결과가 {output_file}에 저장되었습니다.")

def create_enhanced_output_csv(results: List[Dict[str, Any]], output_file: str, append_mode: bool = False):
    """
    가사/앨범 정보가 포함된 크롤링 결과를 CSV 파일로 저장

    Args:
        results: 크롤링 결과 리스트 (가사/앨범 정보 포함)
        output_file: 출력 파일명
        append_mode: True면 기존 파일에 추가, False면 새로 생성
    """
    fieldnames = ['songid', 'song_name', 'artist_name_basket', 'music_url', 'status',
                  'lyrics', 'album_cover_url', 'spotify_track_id', 'album_name', 'duration_ms', 'popularity']

    # 기존 파일이 있으면 append 모드로, 없으면 새로 생성
    file_exists = os.path.exists(output_file)
    mode = 'a' if (append_mode and file_exists) else 'w'

    # UTF-8 BOM을 추가해서 엑셀에서도 제대로 읽히도록 함
    with open(output_file, mode, newline='', encoding='utf-8-sig') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        # 새 파일이거나 append 모드가 아닐 때만 헤더 작성
        if not (append_mode and file_exists):
            writer.writeheader()

        for result in results:
            # 가사 전체 저장 (잘리지 않도록)
            lyrics_full = result.get('lyrics', '') if result.get('lyrics') else ''

            writer.writerow({
                'songid': result.get('id'),  # song_meta.json의 id를 songid로 사용
                'song_name': result.get('song_name'),
                'artist_name_basket': ', '.join(result.get('artist_name_basket', [])) if result.get('artist_name_basket') else '',
                'music_url': result.get('music_url', ''),
                'status': result.get('status', 'failed'),
                'lyrics': lyrics_full,  # 가사 전체 저장
                'album_cover_url': result.get('album_cover_url', ''),
                'spotify_track_id': result.get('spotify_track_id', ''),
                'album_name': result.get('album_name', ''),
                'duration_ms': result.get('duration_ms', ''),
                'popularity': result.get('popularity', '')
            })

    action = "추가" if (append_mode and file_exists) else "저장"
    print(f"가사/앨범 정보가 포함된 결과가 {output_file}에 {action}되었습니다.")

def save_batch_csv(results: List[Dict[str, Any]], batch_num: int, base_filename: str = "music_urls"):
    """
    배치 단위로 CSV 파일 저장

    Args:
        results: 크롤링 결과 리스트
        batch_num: 배치 번호
        base_filename: 기본 파일명
    """
    output_file = f"{base_filename}_batch_{batch_num:03d}.csv"
    if 'lyrics' in results[0] if results else False:
        create_enhanced_output_csv(results, output_file)
    else:
        create_output_csv(results, output_file)
    return output_file