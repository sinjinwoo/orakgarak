import numpy as np
import os

# 설정
NPZ_FILE_FOLDER = r"E:\melondataset\features\0"
# 특정 .npz 파일 이름만 지정 -> 아래 변수에 파일명을 입력
# 비워두면 폴더 내의 모든 .npz 파일 읽음
NPZ_FILE_NAME = "" # ex) my_data.npz


def read_npz_file(file_path):
    try:
        data = np.load(file_path)
        print(f"[*] 파일 내용: {os.path.basename(file_path)} ")
        for key in data.files:
            print(f"  키: '{key}'")
            print(f"  데이터:\n{data[key]}")
        print("-" * (len(os.path.basename(file_path)) + 14))
        print("\n")
    except FileNotFoundError:
        print(f"[Error] 파일을 찾을 수 없습니다: {file_path}")
    except Exception as e:
        print(f"[Error] 파일을 읽는 중 오류가 발생했습니다: {e}")

if __name__ == "__main__":
    if not os.path.isdir(NPZ_FILE_FOLDER):
        print(f"[Error] 지정된 폴더를 찾을 수 없습니다: {NPZ_FILE_FOLDER}")
    elif NPZ_FILE_NAME:
        # 특정 파일만 읽기
        full_path = os.path.join(NPZ_FILE_FOLDER, NPZ_FILE_NAME)
        read_npz_file(full_path)
    else:
        # 폴더 안의 모든 .npz 파일 읽기
        print(f"'{NPZ_FILE_FOLDER}' 폴더 안의 모든 .npz 파일을 읽습니다.\n")
        found_files = False
        try:
            for filename in os.listdir(NPZ_FILE_FOLDER):
                if filename.endswith(".npz"):
                    found_files = True
                    full_path = os.path.join(NPZ_FILE_FOLDER, filename)
                    read_npz_file(full_path)
            if not found_files:
                print(".npz 파일을 찾을 수 없습니다.")
        except Exception as e:
            print(f"[Error] 폴더를 읽는 중 오류가 발생했습니다: {e}")
