# -*- coding: utf-8 -*-
import os
import requests
import base64
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

class ImagenClient:
    """Google Imagen 3.0 API 클라이언트"""

    def __init__(self):
        self.gms_key = os.getenv("GMS_KEY")
        if not self.gms_key:
            raise ValueError("GMS_KEY가 환경변수에 설정되지 않았습니다.")

        self.base_url = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models"
        self.model_name = "imagen-3.0-generate-002"

    def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        safety_filter_level: str = "block_most",
        person_generation: str = "allow_adult"
    ) -> Optional[Dict[str, Any]]:
        """
        Imagen 3.0을 사용해 이미지 생성

        Args:
            prompt: 이미지 생성 프롬프트
            aspect_ratio: 이미지 비율 (1:1, 9:16, 16:9, 3:4, 4:3)
            safety_filter_level: 안전 필터 수준 (block_most, block_some, block_few)
            person_generation: 사람 생성 허용 (dont_allow, allow_adult, allow_all)

        Returns:
            생성된 이미지 정보 (base64 데이터 포함)
        """
        url = f"{self.base_url}/{self.model_name}:predict"

        headers = {
            "Content-Type": "application/json"
        }

        params = {
            "key": self.gms_key
        }

        payload = {
            "instances": [
                {
                    "prompt": prompt
                }
            ],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": aspect_ratio,
                "safetyFilterLevel": safety_filter_level,
                "personGeneration": person_generation,
                "includeRaiReasons": False,  # 안전 필터 이유 제외
                "negativeSeed": 42  # 일관성을 위한 시드
            }
        }

        try:
            print(f"이미지 생성 API 호출 - URL: {url}")
            print(f"프롬프트: {prompt}")
            print(f"파라미터: {payload['parameters']}")

            response = requests.post(
                url,
                headers=headers,
                params=params,
                json=payload,
                timeout=60
            )

            print(f"API 응답 상태 코드: {response.status_code}")

            # Google GMS 프록시는 prompt를 문자열로만 허용할 수도 있으므로 400일 때 한 번 더 시도
            if response.status_code == 400:
                print(f"400 응답 본문: {response.text}")
                fallback_payload = {
                    "instances": [
                        {
                            "prompt": prompt
                        }
                    ],
                    "parameters": {
                        "sampleCount": payload["parameters"].get("sampleCount", 1)
                    }
                }

                print("프롬프트 구조를 단일 문자열로 변경하고 필수 파라미터만 포함하여 재시도합니다.")
                response = requests.post(
                    url,
                    headers=headers,
                    params=params,
                    json=fallback_payload,
                    timeout=60
                )
                print(f"재시도 응답 상태 코드: {response.status_code}")

            if not response.ok:
                print(f"API 에러 응답 본문: {response.text}")
                response.raise_for_status()

            raw_text = response.text
            print(f"API 응답 원문: {raw_text}")
            print(f"응답 헤더: {dict(response.headers)}")

            if not raw_text.strip():
                print("응답 본문이 비어있습니다.")
                return {
                    "success": False,
                    "error": "API 응답 본문이 비어 있습니다.",
                    "response": {}
                }

            try:
                result = response.json()
            except json.JSONDecodeError as decode_error:
                print(f"JSON 파싱 오류: {decode_error}")
                return {
                    "success": False,
                    "error": "API 응답을 JSON으로 파싱할 수 없습니다.",
                    "response": raw_text
                }

            # API에서 리스트 형태로 응답할 경우 대비
            if isinstance(result, list):
                print("API 응답이 리스트 형태로 반환됨")
                result = result[0] if result else {}

            print(f"API 응답 구조: {list(result.keys())}")

            if "predictions" in result and len(result["predictions"]) > 0:
                prediction = result["predictions"][0]
                print(f"예측 결과 키들: {list(prediction.keys())}")

                if "bytesBase64Encoded" in prediction:
                    print(f"Base64 이미지 데이터 길이: {len(prediction['bytesBase64Encoded'])}")
                    return {
                        "success": True,
                        "image_data": prediction["bytesBase64Encoded"],
                        "prompt": prompt,
                        "parameters": {
                            "aspect_ratio": aspect_ratio,
                            "safety_filter_level": safety_filter_level,
                            "person_generation": person_generation
                        }
                    }
                else:
                    print("bytesBase64Encoded 키가 예측 결과에 없음")
                    return {
                        "success": False,
                        "error": "이미지 데이터를 찾을 수 없습니다.",
                        "response": result
                    }
            else:
                print(f"예측 결과 없음 - 전체 응답: {result}")
                return {
                    "success": False,
                    "error": "예측 결과가 없습니다.",
                    "response": result
                }

        except requests.exceptions.RequestException as e:
            return {
                "success": False,
                "error": f"API 요청 실패: {str(e)}"
            }
        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"JSON 파싱 실패: {str(e)}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"예상치 못한 오류: {str(e)}"
            }

    def save_image_from_base64(self, base64_data: str, file_path: str) -> bool:
        """
        Base64 이미지 데이터를 파일로 저장

        Args:
            base64_data: Base64 인코딩된 이미지 데이터
            file_path: 저장할 파일 경로

        Returns:
            저장 성공 여부
        """
        try:
            # Base64 디코딩
            image_bytes = base64.b64decode(base64_data)

            # 파일로 저장
            with open(file_path, "wb") as f:
                f.write(image_bytes)

            return True

        except Exception as e:
            print(f"이미지 저장 실패: {str(e)}")
            return False
