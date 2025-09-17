import os
import sys
import tempfile
import requests
import pandas as pd
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from voice_analysis.user.user_extract_feature import process_user_audio
from recommend.recommend_with_voice import get_recommendations

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

# 전체 곡 features 로드 (서버 시작시 한번만)
ALL_FEATURES_CSV = "C:/Users/SSAFY/Desktop/output/all_features.csv"
all_songs_df = None

class VoiceRecommendationRequest(BaseModel):
    s3_url: str
    pitch_low: Optional[float] = 100.0
    pitch_high: Optional[float] = 320.0
    pitch_avg: Optional[float] = 180.0
    top_n: Optional[int] = 10

def load_all_songs_features():
    """전체 곡 features 로드"""
    global all_songs_df
    try:
        all_songs_df = pd.read_csv(ALL_FEATURES_CSV)
        logging.info(f"전체 곡 features 로드 완료: {len(all_songs_df)}곡")
        return True
    except Exception as e:
        logging.error(f"전체 곡 features 로드 실패: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    """서버 시작시 전체 곡 데이터 로드"""
    if not load_all_songs_features():
        logging.error("전체 곡 데이터 로드 실패")

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "features_loaded": all_songs_df is not None,
        "total_songs": len(all_songs_df) if all_songs_df is not None else 0
    }

@app.post("/voice-recommendation")
async def voice_recommendation(request: VoiceRecommendationRequest):
    """
    S3 presigned URL과 pitch 정보를 받아서 추천 결과 반환
    """
    try:
        # 전체 곡 데이터 확인
        if all_songs_df is None:
            raise HTTPException(
                status_code=500,
                detail="전체 곡 데이터가 로드되지 않았습니다."
            )

        logging.info(f"음성 추천 요청: URL={request.s3_url[:50]}..., pitch=({request.pitch_low}, {request.pitch_high}, {request.pitch_avg})")

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

            # 음성 분석
            logging.info("음성 특성 추출 중...")
            with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as csv_file:
                user_df = process_user_audio(
                    audio_path=temp_audio_path,
                    pitch_low=request.pitch_low,
                    pitch_high=request.pitch_high,
                    pitch_avg=request.pitch_avg,
                    output_csv=csv_file.name
                )

            if user_df is None:
                raise HTTPException(
                    status_code=500,
                    detail="음성 특성 추출에 실패했습니다."
                )

            # 추천 실행
            logging.info("추천 곡 계산 중...")
            recommendations = get_recommendations(user_df, all_songs_df, request.top_n)

            if recommendations.empty:
                return {
                    "status": "success",
                    "message": "추천 결과가 없습니다.",
                    "recommendations": []
                }

            # 결과 반환
            result = {
                "status": "success",
                "recommendations": recommendations.to_dict('records')
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


