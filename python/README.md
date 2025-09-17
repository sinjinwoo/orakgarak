# 🎵 Voice-based Music Recommendation
## 사용자 음성 맞춤 추천 기능 
- 사용자 목소리의 특성을 추출하고 어울리는 노래를 추천

## Feature 추출
사용자의 음성과 곡 데이터에서 음색/톤 관련 특징을 추출하여 추천에 활용

* **MFCC (Mel-Frequency Cepstral Coefficients)**
  * 음성의 음색(timbre)을 수치화
  * 13차원 계수를 평균값으로 사용

* **Pitch Features**
  * `pitch_low`: 최저 음정
  * `pitch_high`: 최고 음정
  * `pitch_avg`: 평균 음정

* **Popularity**
  * 곡이 플레이리스트에 등장한 횟수, 평균 좋아요 수, YouTube 조회수 등을 기반으로 산출
  * 추천 시 **최소 기준치** 이상만 고려 (너무 생소한 노래는 제외시키기 위함)

## 추천 방식
1. **데이터 정규화**
   * `StandardScaler`로 곡 feature와 사용자 feature를 동일 스케일로 변환
2. **유사도 계산**
   * `cosine_similarity`를 사용해 사용자 음성과 곡 간의 음색 유사도 측정
3. **후보 필터링**
   * **인기 필터**: `popularity >= 1000`
   * **Pitch 필터**: 사용자 음역대와 곡 음역대가 일정 범위 내에 포함될 경우만 후보로 사용
   * 후보가 없을 경우 popularity 조건만 적용 (fallback)

4. **상위 곡 추천**
   * 후보 곡 중 유사도가 높은 순으로 정렬
   * `top_n=10` 곡을 추천


## 실행 플로우

```
    [main.py 실행] --> [사용자 음성 파일 입력]
    --> [Mel-Spectrogram 추출]
    --> [MFCC & Pitch 특징 추출]
    --> [user_features.csv 생성]
    --> [전체 곡 Feature(all_features.csv) 불러오기]
    --> [정규화 + 유사도 계산]
    --> [Popularity + Pitch 필터링]
    --> [상위 N개 추천 곡 출력]
```

---

## 실행 방법

### 1. 가상환경 생성 및 활성화 (권장)
```bash
conda create -n voice_env python=3.9
conda activate voice_env
```

### 3. 라이브러리 설치
```bash
pip install -r requirements.txt
```

### 4. 파일 경로 설정 

- **⚠️ 경로 설정 확인 필수**  
  - `main.py` 및 각 스크립트에서 사용하는 파일 경로를 실제 환경에 맞게 수정 필요 
  - 예시:  
    - 사용자 음성 파일 → `C:/Users/project/data/sample_audio.wav`  
    - 전체 곡 Feature CSV → `C:/Users/SSAFY/Desktop/output/all_features.csv`  
    - 사용자 Feature CSV → `C:/Users/SSAFY/Desktop/output/user_features.csv`  

### 5. 전체 파이프라인 실행

```bash
python main.py
```

* 사용자 음성 분석 + feature 추출 + 곡 추천까지 한 번에 수행



### +) 단일 기능 실행

* **사용자 음성 → Feature 추출**

```bash
python voice_analysis/user/user_extract_feature.py
```

→ `user_features.csv` 생성 

* **추천 실행**

```bash
python recommend/recommend_with_voice.py
```

→ 상위 10곡 추천 결과 출력

* **멜 스펙트로그램 시각화**

```bash
python voice_analysis/visualize/plot_mel.py
```

→ `mel_output.png` 저장


## 디렉터리 구조

```
.
├── album_image
│   └── generate_album_image.py
├── recommend
│   └── recommend_with_voice.py
└── voice_analysis
    ├── features
    │   ├── build_song_popularity.py
    │   ├── extract_features.py
    │   ├── extract_mel.py
    │   ├── extract_popularity_with_ytdlp.py
    │   ├── features_merge.py
    │   ├── merge_feature_and_popularity.py
    │   ├── process_dataset.py
    │   ├── process_dataset_parallel.py
    │   └── spotify_features.py
    ├── user
    │   ├── extract_mfcc.py
    │   ├── user_extract_feature.py
    │   └── voice_keyword_generator.py
    ├── visualize
    │   └── plot_mel.py
    └── main.py
```

## `album_image`

### `generate_album_image.py`
- **목적**: Stable Diffusion XL 모델을 사용하여 앨범 커버 이미지 생성
- **설명**: 텍스트 프롬프트를 입력받아 분위기에 맞는 이미지 생성. 결과 이미지는 `album_cover.png`로 저장됨

## `recommend`

### `recommend_with_voice.py`
- **목적**: 사용자의 음성 특징을 기반으로 노래를 추천
- **설명**: 사전에 계산된 노래 특징과 사용자 음성 특징을 불러오기. 사용자의 음성(MFCC)과 노래 간의 코사인 유사도를 계산하고, 인기도 및 음역대 필터를 적용하여 가장 유사한 상위 10곡을 추천.

## `voice_analysis`

음성 및 음악 분석의 핵심 로직을 포함하는 디렉터리

### `main.py`
- **목적**: 음성 분석 및 추천 기능을 시연하는 메인 스크립트
- **설명**: 사용자 음성 파일을 분석하고, 노래 벡터 라이브러리와 비교하여 상위 추천 곡 출력

---

### `features/`

오디오 특징을 추출하고 처리하기 위한 디렉터리

- **`extract_mel.py`**: 오디오 파일에서 log-mel spectrogram을 추출 
- **`extract_features.py`**: 멜 스펙트로그램에서 MFCC(음색) 및 피치 관련 특징(저음, 고음, 평균 음높이)과 같은 고수준 특징을 추출
- **`build_song_popularity.py`**: 각 노래가 얼마나 많은 플레이리스트에 포함되었는지, 그리고 해당 플레이리스트의 평균 '좋아요' 수를 기반으로 인기도 점수를 계산 (사용X)
- **`process_dataset.py`**: 대규모 노래 데이터셋을 처리. 각 노래의 멜 스펙트로그램을 로드하고, `extract_features.py`를 사용해 특징을 추출한 뒤, 인기도 점수를 추가하여 JSON 파일로 저장
- **`process_dataset_parallel.py`**: `process_dataset.py`의 병렬 처리 버전으로, 여러 CPU 코어를 사용하여 전체 데이터셋의 특징 추출 속도를 높임
- **`features_merge.py`**: 개별적인 노래 특징 JSON 파일들을 단일 CSV 파일(`all_features.csv`)로 병합하여 처리
- **`extract_popularity_with_ytdlp.py`**: `yt-dlp`를 사용하여 YouTube에서 노래방 영상을 검색하고, 조회수를 인기도 지표로 사용
- **`merge_feature_and_popularity.py`**: 노래 특징과 YouTube 조회수 기반의 인기도 점수를 병합하여 최종 업데이트된 CSV 파일을 생성
- **`spotify_features.py`**: Spotify API에 연결하여 주어진 트랙의 오디오 특징을 가져오는 스크립트 (사용X)

---

### `user/`

사용자별 음성 데이터 처리에 관련된 디렉터리

- **`extract_mfcc.py`**: 멜 스펙트로그램에서 MFCC만 추출
- **`user_extract_feature.py`**: 사용자 오디오 파일을 처리 -> MFCC 추출 및 사용자의 피치 정보와 결합하여 feature CSV 파일 생성
- **`voice_keyword_generator.py`**: 사용자 음성을 분석하여 설명 키워드를 생성 -> 다양한 오디오 포맷을 WAV로 변환 제공
---

### `visualize/`

데이터 시각화 스크립트 (사용X 나중에 자료용)

- **`plot_mel.py`**: 오디오 파일의 멜 스펙트로그램 플롯을 생성 및 저장

