import os
import json
import pandas as pd
from glob import glob
from tqdm import tqdm

# 경로 설정
features_base_dir = "E:/melondataset/features"
output_csv_path = "C:/Users/SSAFY/Desktop/output/all_features.csv"

# 모든 파일 탐색 
json_files = glob(os.path.join(features_base_dir, "**", "*.json"), recursive=True)

all_records = []

# 통합
for file_path in tqdm(json_files, desc="JSON -> CSV 통합 중"):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        flat_record = {}

        for key, value in data.items():
            if isinstance(value, list):
                for i, v in enumerate(value):
                    flat_record[f"{key}_{i}"] = v
            else:
                flat_record[key] = value

        all_records.append(flat_record)
    except Exception as e:
        print(f"[Error] {file_path}: {e}")

# pandas로 변환
df = pd.DataFrame(all_records)

# 저장
df.to_csv(output_csv_path, index=False, encoding="utf-8-sig")
print(f"\n통합 CSV 저장 : {output_csv_path}")