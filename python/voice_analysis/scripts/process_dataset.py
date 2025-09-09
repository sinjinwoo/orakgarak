import numpy as np
import os
import tqdm
from extract_features import extract_features
from extract_mel import extract_mel

# 전체 데이터셋 순회하여 각 멜 스펙트로그램 파일에서 feature 추출 후 저장
# dataset_path: 원본 멜 스펙트로그램 데이터셋 경로
# output_path: 추출된 피처 저장 경로
# song_ids: 처리할 song_id 목록(iterable)
def process_dataset(dataset_path, output_path, song_ids):

    # 디렉토리 생성
    if not os.path.exists(output_path):
        os.makedirs(output_path)
        print(f"'{output_path}' 디렉토리 생성 완료")

    # 진행 상황 표시 -> tqdm
    for song_id in tqdm.tqdm(song_ids, desc="피처 추출 진행 중"):
        # 파일 경로 구성
        subdir = str(song_id // 1000)
        mel_path = os.path.join(dataset_path, subdir, f"{song_id}.npy")
        
        output_subdir = os.path.join(output_path, subdir)
        if not os.path.exists(output_subdir):
            os.makedirs(output_subdir, exist_ok=True) # 동시성 문제 방지용 True
            
        output_filepath = os.path.join(output_subdir, f"{song_id}.npz")

        if os.path.exists(mel_path):
            if os.path.exists(output_filepath):
                print(f"이미 처리된 파일: {output_filepath}, 건너뜀")
                continue
            try:
                # 멜 스펙트로그램 로드
                mel_spectrogram = np.load(mel_path)

                features = {
                    "song_id": song_id,
                    **extract_features(mel_spectrogram)
                }
                
                # # 피처 추출
                # features = extract_features(mel_spectrogram)

                # # song_id 추가
                # features["song_id"] = song_id

                # 피처 저장 (.npz 형식으로 여러 피처를 함께 저장)
                np.savez_compressed(output_filepath, **features)
                
            except Exception as e:
                print(f"\n[Error] {mel_path} 처리 중 오류 발생: {e}")
        else:
            pass


if __name__ == '__main__':
    MELON_DATASET_PATH = "E:\\melondataset\\data"  # 원본 멜 스펙트로그램 데이터셋 경로
    OUTPUT_FEATURES_PATH = "E:\\melondataset\\features"   # 추출된 피처를 저장할 경로
    TOTAL_SONGS = 10   # 처리할 총 곡 수 707989 
    
    print("="*50)
    print("음악 데이터셋 피처 추출 시작")
    print(f"데이터셋 경로: {MELON_DATASET_PATH}")
    print(f"저장 경로: {OUTPUT_FEATURES_PATH}")
    print("="*50)
    
    # 전체 데이터셋에 대해 처리
    song_id_range = range(TOTAL_SONGS)
    process_dataset(MELON_DATASET_PATH, OUTPUT_FEATURES_PATH, song_id_range)

    print("="*50)
    print("피처 추출 완료.")
    print("="*50)

    # 처리된 첫 번째 파일 샘플 확인
    sample_id = 0
    sample_output_dir = os.path.join(OUTPUT_FEATURES_PATH, str(sample_id // 1000))
    sample_file_path = os.path.join(sample_output_dir, f"{sample_id}.npz")

    if os.path.exists(sample_file_path):
        print("\n[저장된 피처 샘플 확인]")
        loaded_features = np.load(sample_file_path)
        for feature_name in loaded_features.files:
            print(f"- {feature_name}:")
            print(f"  Shape: {loaded_features[feature_name].shape}")
            print(f"  Value: {loaded_features[feature_name]}")
    else:
        print(f"\n샘플 파일을 찾을 수 없습니다: {sample_file_path}")
