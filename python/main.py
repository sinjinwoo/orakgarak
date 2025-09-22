import os
import sys
import tempfile
import requests
import pandas as pd
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from voice_analysis.user.user_extract_feature import process_user_audio
from voice_analysis.features.extract_mel import extract_mel
from voice_analysis.features.extract_features import extract_features
from recommend.recommend_with_voice import get_recommendations
from ai.image_generation.imagen_client import ImagenClient
from voice_analysis.user.voice_keyword_generator import analyze_voice

app = FastAPI(root_path="/data")

# CORS 설정
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

# DB에 존재하는 곡들의 features 로드 (서버 시작시 한번만)
ALL_FEATURES_CSV = "C:/Users/SSAFY/Desktop/S13P21C103/python/dataset/filtered_features.csv"
all_songs_df = None

class VoiceRecommendationRequest(BaseModel):
    s3_url: str
    top_n: Optional[int] = 10

def load_all_songs_features():
    """DB에 존재하는 곡들의 features 로드"""
    global all_songs_df
    try:
        all_songs_df = pd.read_csv(ALL_FEATURES_CSV)
        logging.info(f"DB 매칭된 곡 features 로드 완료: {len(all_songs_df)}곡")
        return True
    except Exception as e:
        logging.error(f"DB 매칭된 곡 features 로드 실패: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """서버 시작시 DB 매칭된 곡 데이터 로드"""
    if not load_all_songs_features():
        logging.error("DB 매칭된 곡 데이터 로드 실패")

@app.get("/health")
# Request/Response 모델
class RecordData(BaseModel):
    id: int
    userId: int
    songId: Optional[int] = None  # Upload ID 기반으로 올 때는 songId가 없을 수 있음
    title: str
    durationSeconds: Optional[int] = None
    extension: Optional[str] = None
    content_type: Optional[str] = None
    file_size: Optional[str] = None
    url: str
    urlStatus: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    uploadId: Optional[int] = None

class VoiceImageGenerationRequest(BaseModel):
    records: List[RecordData]
    aspect_ratio: Optional[str] = "1:1"
    safety_filter_level: Optional[str] = "block_most"
    person_generation: Optional[str] = "allow_adult"

class VoiceImageGenerationResponse(BaseModel):
    success: bool
    image_base64: Optional[str] = None
    generated_prompt: Optional[str] = None
    voice_keywords: Optional[List[str]] = None
    song_titles: Optional[List[str]] = None
    parameters: Optional[dict] = None
    error: Optional[str] = None

# Validation 오류 핸들러
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error(f"Validation error: {exc.errors()}")
    logging.error(f"Request body: {await request.body()}")
    return JSONResponse(
        status_code=422,
        content={"detail": f"Validation error: {exc.errors()}"}
    )

# 클라이언트 초기화
imagen_client = ImagenClient()

@app.get("/ai/health")
async def health_check():
    return {
        "status": "ok",
        "features_loaded": all_songs_df is not None,
        "total_songs": len(all_songs_df) if all_songs_df is not None else 0
    }

@app.post("/ai/voice-recommendation")
async def voice_recommendation(request: VoiceRecommendationRequest):
    """
    S3 URL에서 음성 파일을 받아서 추천 결과 반환
    """
    try:
        # DB 매칭된 곡 데이터 확인
        if all_songs_df is None:
            raise HTTPException(
                status_code=500,
                detail="DB 매칭된 곡 데이터가 로드되지 않았습니다."
            )

        # S3에서 파일 다운로드
        temp_audio_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                logging.info("S3에서 음성 파일 다운로드 중...")
                response = requests.get(request.s3_url, timeout=30)
                response.raise_for_status()
                tmp_file.write(response.content)
                temp_audio_path = tmp_file.name
                logging.info(f"음성 파일 다운로드 완료: {len(response.content)} bytes")

            # 음성에서 pitch 자동 추출 및 분석
            logging.info("음성 특성 추출 중...")

            # 1. 멜 스펙트로그램 추출
            mel = extract_mel(temp_audio_path)
            if mel is None:
                raise HTTPException(
                    status_code=500,
                    detail="멜 스펙트로그램 추출에 실패했습니다."
                )

            # 2. 특성 추출 (pitch 자동 계산 포함)
            features = extract_features(mel)

            # 3. DataFrame 생성
            feature_dict = {
                "song_id": ["user_audio"],
            }
            for i, val in enumerate(features['mfcc']):
                feature_dict[f"mfcc_{i}"] = [val]

            feature_dict["pitch_low"] = [features['pitch_low']]
            feature_dict["pitch_high"] = [features['pitch_high']]
            feature_dict["pitch_avg"] = [features['pitch_avg']]
            feature_dict["popularity"] = [0.0]

            user_df = pd.DataFrame(feature_dict)
            logging.info(f"자동 추출된 pitch: low={features['pitch_low']:.2f}, high={features['pitch_high']:.2f}, avg={features['pitch_avg']:.2f}")

            if user_df is None or user_df.empty:
                raise HTTPException(
                    status_code=500,
                    detail="음성 특성 추출에 실패했습니다."
                )

            # 음성 분석 (키워드 추출)
            logging.info("음성 분석 중...")
            voice_analysis = analyze_voice(temp_audio_path)
            logging.info(f"음성 분석 결과: {voice_analysis}")

            # 추천 실행
            logging.info("추천 곡 계산 중...")
            recommendations = get_recommendations(user_df, all_songs_df, request.top_n)

            if recommendations.empty:
                return {
                    "status": "success",
                    "message": "추천 결과가 없습니다.",
                    "recommendations": [],
                    "voice_analysis": voice_analysis
                }

            # 결과 반환
            result = {
                "status": "success",
                "recommendations": recommendations.to_dict('records'),
                "voice_analysis": voice_analysis
            }

            logging.info(f"추천 완료: {len(recommendations)}곡")
            return result

        except requests.exceptions.RequestException as e:
            logging.error(f"S3 파일 다운로드 오류: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"음성 파일 다운로드 실패: {str(e)}"
            )

        finally:
            # 임시 파일 정리
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"음성 추천 처리 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )

@app.post("/ai/generate-voice-image", response_model=VoiceImageGenerationResponse)
async def generate_voice_image(request: VoiceImageGenerationRequest):
    """
    녹음 리스트 기반 AI 이미지 생성 API
    """
    try:
        logging.info(f"Received voice image generation request with {len(request.records)} records")
        logging.info(f"Request parameters: aspect_ratio={request.aspect_ratio}, safety_filter_level={request.safety_filter_level}, person_generation={request.person_generation}")

        for i, record in enumerate(request.records):
            logging.info(f"Record {i}: id={record.id}, userId={record.userId}, songId={record.songId}, title='{record.title}', url='{record.url[:50] if record.url else None}...'")

        # 1. 녹음된 음성들에서 키워드 추출
        voice_keywords = []
        song_titles = []

        for record in request.records:
            temp_audio_path = None
            try:
                # S3 URL에서 파일 다운로드
                logging.info(f"S3에서 음성 파일 다운로드 중... (ID: {record.id})")
                with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                    response = requests.get(record.url, timeout=30)
                    response.raise_for_status()
                    tmp_file.write(response.content)
                    temp_audio_path = tmp_file.name
                    logging.info(f"음성 파일 다운로드 완료: {len(response.content)} bytes")

                # 음성 분석으로 키워드 추출
                voice_analysis = analyze_voice(temp_audio_path)
                voice_keywords.append(voice_analysis)
                logging.info(f"음성 분석 성공 (ID: {record.id}): {voice_analysis}")

                # 노래 제목도 수집
                if record.title:
                    song_titles.append(record.title)

            except requests.exceptions.RequestException as e:
                logging.error(f"S3 파일 다운로드 오류 (ID: {record.id}): {e}")
                continue
            except Exception as e:
                logging.error(f"음성 분석 실패 (ID: {record.id}): {str(e)}")
                import traceback
                traceback.print_exc()
                continue
            finally:
                # 임시 파일 정리
                if temp_audio_path and os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)

        # 2. 키워드와 노래 제목을 바탕으로 프롬프트 생성
        if not voice_keywords and not song_titles:
            return VoiceImageGenerationResponse(
                success=False,
                error="음성 분석 및 노래 정보를 추출할 수 없습니다."
            )

        # 프롬프트 구성
        prompt_parts = []

        if voice_keywords:
            voice_desc = ", ".join(voice_keywords[:])  # 최대 3개 음성 특성
            prompt_parts.append(f"음성 특성: {voice_desc}")

        if song_titles:
            songs_desc = ", ".join(song_titles[:])  # 최대 5개 노래 제목
            prompt_parts.append(f"노래: {songs_desc}")

        # 다양한 스타일과 강력한 텍스트 제거 프롬프트 생성
        import random

        # 스타일 옵션들
        styles = [
            "fluid organic shapes with flowing curves",
            "atmospheric color gradients and soft textures",
            "dynamic brush strokes and paint splatters",
            "dreamlike swirling patterns",
            "ethereal light and shadow play",
            "cosmic nebula-like formations",
            "watercolor-style color bleeds",
            "oil painting texture with thick impasto",
            "crystalline formations and prismatic effects",
            "zen-like minimalist composition"
        ]

        # 무드 설정
        mood_desc = ""
        if voice_keywords:
            mood_desc = voice_keywords[0]
        elif song_titles:
            mood_desc = "musical harmony"
        else:
            mood_desc = "emotional expression"

        # 랜덤 스타일 선택
        selected_style = random.choice(styles)

        base_prompt = f"Pure abstract art with {selected_style}, expressing {mood_desc}, rich vibrant colors, artistic composition. NO TEXT NO LETTERS NO WORDS NO TYPOGRAPHY NO SYMBOLS NO NUMBERS NO WRITING NO CHARACTERS NO ALPHABET NO LANGUAGE. Only shapes, colors, textures, and visual elements."

        # 3. 이미지 생성
        print(f"생성할 프롬프트: {base_prompt}")
        print(f"이미지 생성 파라미터: aspect_ratio={request.aspect_ratio}, safety_filter_level={request.safety_filter_level}, person_generation={request.person_generation}")

        # 안전 필터 레벨을 더 관대하게 설정
        safety_level = "block_few" if request.safety_filter_level == "block_most" else request.safety_filter_level

        result = imagen_client.generate_image(
            prompt=base_prompt,
            aspect_ratio=request.aspect_ratio,
            safety_filter_level=safety_level,
            person_generation="dont_allow"  # 사람 생성 명시적으로 비활성화
        )

        print(f"이미지 생성 결과: success={result.get('success')}")
        if not result.get("success"):
            print(f"이미지 생성 실패 - 오류: {result.get('error')}")
            print(f"전체 응답: {result}")

        if result["success"]:
            image_data = result.get("image_data")
            print(f"이미지 데이터 존재 여부: {image_data is not None}")
            if image_data:
                print(f"이미지 데이터 길이: {len(image_data)}")

            return VoiceImageGenerationResponse(
                success=True,
                image_base64=image_data,
                generated_prompt=base_prompt,
                voice_keywords=voice_keywords,
                song_titles=song_titles,
                parameters=result["parameters"]
            )
        else:
            return VoiceImageGenerationResponse(
                success=False,
                generated_prompt=base_prompt,
                voice_keywords=voice_keywords,
                song_titles=song_titles,
                error=result.get("error", "이미지 생성 실패")
            )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"음성 기반 이미지 생성 중 오류 발생: {str(e)}"
        )


