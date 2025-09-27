import os
import sys
import tempfile
import requests
import pandas as pd
import numpy as np
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 경로 설정
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(PROJECT_ROOT)

from voice_analysis.user.user_extract_feature import process_user_audio
from voice_analysis.features.extract_mel import extract_mel
from voice_analysis.features.extract_features import extract_features
from recommend.recommend_with_voice import get_recommendations
from ai.image_generation.imagen_client import ImagenClient
from voice_analysis.user.voice_keyword_generator import analyze_voice
from vector_db.user_recording_manager import UserRecordingManager
from vector_db.user_vector_manager import UserVectorManager
from vector_db.pinecone_recommender import PineconeRecommender
from database.mysql_manager import MySQLManager

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

# 사용자 녹음 관리자 초기화
user_recording_manager = None
user_vector_manager = None
pinecone_recommender = None
mysql_manager = None

class VoiceRecommendationRequest(BaseModel):
    user_id: int
    upload_id: str
    top_n: Optional[int] = 10

class SaveUserVectorRequest(BaseModel):
    s3_url: str
    user_id: int
    upload_id: Optional[str] = None
    song_id: Optional[int] = None


class SimilarVoiceRecommendationRequest(BaseModel):
    user_id: int
    upload_id: str
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
    """서버 시작시 DB 매칭된 곡 데이터 및 사용자 녹음 관리자 초기화"""
    global user_recording_manager, user_vector_manager, pinecone_recommender, mysql_manager

    if not load_all_songs_features():
        logging.error("DB 매칭된 곡 데이터 로드 실패")

    # 사용자 녹음 관리자 초기화
    try:
        user_recording_manager = UserRecordingManager()
        if user_recording_manager.connect():
            logging.info("사용자 녹음 관리자 초기화 성공")
        else:
            logging.error("사용자 녹음 관리자 연결 실패")
            user_recording_manager = None
    except Exception as e:
        logging.error(f"사용자 녹음 관리자 초기화 오류: {e}")
        user_recording_manager = None

    # 사용자 벡터 관리자 초기화
    try:
        user_vector_manager = UserVectorManager()
        if user_vector_manager.connect():
            logging.info("사용자 벡터 관리자 초기화 성공")
        else:
            logging.error("사용자 벡터 관리자 연결 실패")
            user_vector_manager = None
    except Exception as e:
        logging.error(f"사용자 벡터 관리자 초기화 오류: {e}")
        user_vector_manager = None

    # Pinecone 추천 시스템 초기화
    try:
        pinecone_recommender = PineconeRecommender()
        if pinecone_recommender.connect():
            logging.info("Pinecone 추천 시스템 초기화 성공")
        else:
            logging.error("Pinecone 추천 시스템 연결 실패")
            pinecone_recommender = None
    except Exception as e:
        logging.error(f"Pinecone 추천 시스템 초기화 오류: {e}")
        pinecone_recommender = None

    # MySQL 관리자 초기화
    try:
        mysql_manager = MySQLManager()
        if mysql_manager.connect():
            logging.info("MySQL 관리자 초기화 성공")
        else:
            logging.error("MySQL 관리자 연결 실패")
            mysql_manager = None
    except Exception as e:
        logging.error(f"MySQL 관리자 초기화 오류: {e}")
        mysql_manager = None

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
    저장된 사용자 벡터를 기반으로 추천
    """
    try:
        if pinecone_recommender is None:
            raise HTTPException(
                status_code=500,
                detail="Pinecone 추천 시스템이 초기화되지 않았습니다."
            )

        if user_vector_manager is None:
            raise HTTPException(
                status_code=500,
                detail="사용자 벡터 관리자가 초기화되지 않았습니다."
            )

        # 해당 사용자의 벡터 조회
        user_vector = user_vector_manager.get_user_vector(
            str(request.user_id),
            request.upload_id
        )

        if user_vector is None:
            raise HTTPException(
                status_code=404,
                detail="사용자 벡터를 찾을 수 없습니다."
            )

        # 사용자 기록 조회 (pitch 정보용)
        user_history = user_vector_manager.get_user_history(str(request.user_id))
        target_record = None
        for record in user_history:
            if record["upload_id"] == request.upload_id:
                target_record = record
                break

        if not target_record:
            raise HTTPException(
                status_code=404,
                detail="해당 업로드 기록을 찾을 수 없습니다."
            )

        # 피처 딕셔너리 구성
        user_features = {
            "pitch_low": target_record["pitch_low"],
            "pitch_high": target_record["pitch_high"],
            "pitch_avg": target_record["pitch_avg"]
        }

        # MFCC는 벡터에서 추출 (처음 13개)
        for i in range(13):
            user_features[f"mfcc_{i}"] = float(user_vector[i])

        # 저장된 사용자 장르 활용
        user_genres = []
        if target_record.get("user_genres"):
            stored_genres = target_record["user_genres"].split(", ")
            user_genres = [g.strip() for g in stored_genres if g.strip()]

        # 사용자가 싫어요한 곡 ID 목록 가져오기
        disliked_song_ids = []
        if mysql_manager:
            try:
                disliked_song_ids = mysql_manager.get_user_disliked_songs(request.user_id)
                logging.info(f"사용자 {request.user_id}의 싫어요 곡 {len(disliked_song_ids)}개 조회")
            except Exception as e:
                logging.error(f"싫어요 곡 조회 오류: {e}")

        # Pinecone 기반 추천 (voice analysis 로직 + dislike 페널티 반영)
        recommendations = pinecone_recommender.get_recommendations(
            user_features=user_features,
            top_n=request.top_n,
            min_popularity=50,  # 인기도 필터를 낮춰서 더 많은 곡 포함
            use_pitch_filter=True,
            allowed_genres=user_genres,  # 저장된 사용자 어울리는 장르 사용
            disliked_song_ids=disliked_song_ids,  # 싫어요 곡 ID 목록
            penalty_factor=0.1  # recommend_with_voice.py와 동일한 페널티 팩터
        )

        if recommendations.empty:
            return {
                "status": "success",
                "message": "추천 결과가 없습니다.",
                "recommendations": []
            }

        # 결과 반환
        result = {
            "status": "success",
            "recommendations": recommendations.to_dict('records'),
            "based_on_record": request.upload_id,
            "voice_analysis": {
                "summary": target_record.get("voice_analysis", ""),
                "desc": target_record.get("voice_desc", []),
                "allowedGenres": target_record.get("user_genres", "").split(", ") if target_record.get("user_genres") else []
            }
        }

        logging.info(f"벡터 기반 추천 완료: {len(recommendations)}곡")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"벡터 기반 추천 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )

@app.post("/ai/save-user-vector")
async def save_user_vector(request: SaveUserVectorRequest):
    """
    S3 URL에서 음성 파일을 분석하여 벡터 DB에 저장
    """
    try:
        if user_vector_manager is None:
            raise HTTPException(
                status_code=500,
                detail="사용자 벡터 관리자가 초기화되지 않았습니다."
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

            # 음성에서 특성 추출
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

            # 3. 사용자 피처 딕셔너리 구성
            user_features_dict = {
                "pitch_low": features['pitch_low'],
                "pitch_high": features['pitch_high'],
                "pitch_avg": features['pitch_avg']
            }
            for i, val in enumerate(features['mfcc']):
                user_features_dict[f"mfcc_{i}"] = val

            logging.info(f"추출된 pitch: low={features['pitch_low']:.2f}, high={features['pitch_high']:.2f}, avg={features['pitch_avg']:.2f}")

            # 음성 분석 (키워드 추출)
            logging.info("음성 분석 중...")
            voice_analysis_result = analyze_voice(temp_audio_path)
            logging.info(f"음성 분석 결과: {voice_analysis_result}")

            # 분석 결과에서 정보 추출
            voice_summary = voice_analysis_result.get("summary", "")
            voice_desc = voice_analysis_result.get("desc", [])
            user_genres = voice_analysis_result.get("allowed_genres", [])

            # 벡터 DB에 저장
            song_id_str = None
            if request.song_id is not None:
                song_id_str = str(request.song_id)

            vector_id = user_vector_manager.save_user_vector(
                str(request.user_id),
                user_features_dict,
                request.upload_id,
                voice_summary,  # 분석 요약
                song_id_str,
                voice_desc,     # 상세 설명 리스트
                user_genres     # 어울리는 장르 리스트
            )

            if vector_id is None:
                raise HTTPException(
                    status_code=500,
                    detail="벡터 저장에 실패했습니다."
                )

            # 결과 반환
            result = {
                "status": "success",
                "vector_id": vector_id,
                "user_id": request.user_id,
                "upload_id": request.upload_id,
                "features": {
                    "pitch_low": features['pitch_low'],
                    "pitch_high": features['pitch_high'],
                    "pitch_avg": features['pitch_avg'],
                    "mfcc_count": 13
                },
                "voice_analysis": {
                    "summary": voice_summary,
                    "desc": voice_desc,
                    "allowed_genres": user_genres
                }
            }

            logging.info(f"사용자 벡터 저장 완료: {vector_id}")
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
        logging.error(f"사용자 벡터 저장 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )

@app.post("/ai/generate-voice-image", response_model=VoiceImageGenerationResponse)
async def generate_voice_image(request: VoiceImageGenerationRequest):
    """
    Pinecone 메타데이터 기반 AI 이미지 생성 API (파일 다운로드 없이 처리)
    """
    try:
        logging.info(f"Received Pinecone metadata-based voice image generation request with {len(request.records)} records")
        logging.info(f"Request parameters: aspect_ratio={request.aspect_ratio}, safety_filter_level={request.safety_filter_level}, person_generation={request.person_generation}")

        # 1. Pinecone 메타데이터에서 음성 분석 정보 추출 (파일 다운로드 없이)
        voice_keywords = []
        song_titles = []

        if user_vector_manager is None:
            logging.error("사용자 벡터 관리자가 초기화되지 않았습니다.")
            return VoiceImageGenerationResponse(
                success=False,
                error="벡터 관리 시스템을 사용할 수 없습니다."
            )

        for record in request.records:
            try:
                # Pinecone 메타데이터에서 음성 분석 정보 조회 (파일 다운로드 없이)
                upload_id = str(record.uploadId) if hasattr(record, 'uploadId') and record.uploadId else str(record.id)
                user_id = str(record.userId)

                logging.info(f"Pinecone에서 메타데이터 조회 중... (Upload ID: {upload_id}, User ID: {user_id})")

                # 사용자 기록에서 음성 분석 정보 조회
                user_history = user_vector_manager.get_user_history(user_id)
                target_record = None

                for history_record in user_history:
                    if history_record.get("upload_id") == upload_id:
                        target_record = history_record
                        break

                if target_record:
                    # Pinecone 메타데이터에서 음성 분석 결과 추출
                    voice_summary = target_record.get("voice_analysis", "")
                    if voice_summary:
                        voice_keywords.append(voice_summary)
                        logging.info(f"Pinecone 메타데이터에서 음성 분석 정보 조회 성공 (Upload ID: {upload_id}): {voice_summary}")

                    # 노래 제목 수집
                    if record.title:
                        song_titles.append(record.title)
                else:
                    logging.warning(f"Pinecone 메타데이터에서 Upload ID {upload_id} 정보를 찾을 수 없음")
                    # 기본값 사용
                    if record.title:
                        voice_keywords.append(f"음악적 표현: {record.title}")
                        song_titles.append(record.title)

            except Exception as e:
                logging.error(f"Pinecone 메타데이터 조회 실패 (ID: {record.id}): {str(e)}")
                # 기본값으로 대체
                if record.title:
                    voice_keywords.append(f"음악적 표현: {record.title}")
                    song_titles.append(record.title)
                continue

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


@app.post("/ai/similar-voice-recommendation")
async def similar_voice_recommendation(request: SimilarVoiceRecommendationRequest):
    """
    목소리가 유사한 다른 사용자들이 부른 노래 추천
    """
    try:
        if pinecone_recommender is None:
            raise HTTPException(
                status_code=500,
                detail="Pinecone 추천 시스템이 초기화되지 않았습니다."
            )

        if user_vector_manager is None:
            raise HTTPException(
                status_code=500,
                detail="사용자 벡터 관리자가 초기화되지 않았습니다."
            )

        # 해당 사용자의 벡터 조회
        user_vector = user_vector_manager.get_user_vector(
            str(request.user_id),
            request.upload_id
        )

        if user_vector is None:
            raise HTTPException(
                status_code=404,
                detail="사용자 벡터를 찾을 수 없습니다."
            )

        # 사용자 기록 조회 (pitch 정보용)
        user_history = user_vector_manager.get_user_history(str(request.user_id))
        target_record = None
        for record in user_history:
            if record["upload_id"] == request.upload_id:
                target_record = record
                break

        if not target_record:
            raise HTTPException(
                status_code=404,
                detail="해당 업로드 기록을 찾을 수 없습니다."
            )

        # Pinecone에서 유사한 사용자 벡터 검색 (사용자 타입만)
        search_results = pinecone_recommender.index.query(
            vector=user_vector.tolist(),
            top_k=request.top_n * 3,  # 여유분 확보
            filter={
                "type": "user",  # 사용자 벡터만
                "user_id": {"$ne": str(request.user_id)}  # 본인 제외
            },
            include_metadata=True
        )

        # 유사한 사용자들의 정보 수집
        similar_users = []
        for match in search_results.matches:
            similar_users.append({
                "user_id": match.metadata.get("user_id"),
                "upload_id": match.metadata.get("upload_id"),
                "similarity": float(match.score),
                "pitch_low": match.metadata.get("pitch_low"),
                "pitch_high": match.metadata.get("pitch_high"),
                "pitch_avg": match.metadata.get("pitch_avg")
            })

        if not similar_users:
            return {
                "status": "success",
                "message": "유사한 목소리의 사용자를 찾을 수 없습니다.",
                "recommendations": []
            }

        # 유사한 사용자들이 부른 노래들 추천
        # 여기서는 각 유사 사용자의 특성을 평균내어 노래 추천
        avg_features = {
            "pitch_low": sum(u["pitch_low"] for u in similar_users) / len(similar_users),
            "pitch_high": sum(u["pitch_high"] for u in similar_users) / len(similar_users),
            "pitch_avg": sum(u["pitch_avg"] for u in similar_users) / len(similar_users)
        }

        # 평균 MFCC 계산 (모든 유사 사용자의 벡터 평균)
        avg_vector = np.mean([user_vector], axis=0)  # 일단 현재 사용자 벡터 기준
        for i in range(13):
            avg_features[f"mfcc_{i}"] = float(avg_vector[i])

        # 노래 추천 필터 구성 (유사 목소리 추천에서는 장르 제한 없이)
        song_filter = {"popularity": {"$gte": 1000}}  # 기본 인기도 필터만

        # 노래 추천 (사용자 타입 제외)
        song_recommendations = pinecone_recommender.index.query(
            vector=avg_vector.tolist(),
            top_k=request.top_n * 3,  # 여유분 확보해서 정렬
            filter=song_filter,
            include_metadata=True
        )

        # 결과 파싱 및 voice analysis 기반 점수 계산
        recommendations = []
        for match in song_recommendations.matches:
            song_data = {
                "song_id": int(match.id),
                "similarity": float(match.score),
                "popularity": match.metadata.get("popularity", 0),
                "pitch_low": match.metadata.get("pitch_low", 0),
                "pitch_high": match.metadata.get("pitch_high", 0),
                "pitch_avg": match.metadata.get("pitch_avg", 0),
                "genre": match.metadata.get("genre", "")
            }

            # voice analysis 기반 점수 계산 (평균 사용자 특성 기준)
            vector_score = song_data["similarity"]

            # pitch 조건 체크
            user_pitch_low = avg_features.get("pitch_low", 0)
            user_pitch_high = avg_features.get("pitch_high", 1000)
            user_pitch_avg = avg_features.get("pitch_avg", 200)

            pitch_condition_satisfied = (
                song_data["pitch_low"] >= user_pitch_low and
                song_data["pitch_high"] <= user_pitch_high and
                abs(song_data["pitch_avg"] - user_pitch_avg) <= 20
            )

            # pitch 유사도 계산
            pitch_diff_low = abs(song_data["pitch_low"] - user_pitch_low)
            pitch_diff_high = abs(song_data["pitch_high"] - user_pitch_high)
            pitch_diff_avg = abs(song_data["pitch_avg"] - user_pitch_avg)

            pitch_score_low = max(0, 1 - (pitch_diff_low / 100))
            pitch_score_high = max(0, 1 - (pitch_diff_high / 100))
            pitch_score_avg = max(0, 1 - (pitch_diff_avg / 50))

            pitch_score = (pitch_score_low + pitch_score_high + pitch_score_avg) / 3

            if not pitch_condition_satisfied:
                pitch_score *= 0.5

            # 최종 점수 계산
            final_score = (vector_score * 0.6) + (pitch_score * 0.4)
            popularity_bonus = min(0.1, song_data["popularity"] / 100000)
            final_score += popularity_bonus

            song_data["final_score"] = final_score
            song_data["pitch_score"] = pitch_score
            song_data["pitch_condition_satisfied"] = pitch_condition_satisfied

            recommendations.append(song_data)

        # 최종 점수로 정렬하고 상위 N개 선택
        recommendations.sort(key=lambda x: x["final_score"], reverse=True)
        recommendations = recommendations[:request.top_n]

        # 결과 반환
        result = {
            "status": "success",
            "recommendations": recommendations,
            "similar_users_found": len(similar_users),
            "similar_users": similar_users[:5]  # 상위 5명만 반환
        }

        logging.info(f"유사 목소리 기반 추천 완료: {len(recommendations)}곡, {len(similar_users)}명의 유사 사용자")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"유사 목소리 추천 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )


