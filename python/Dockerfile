# Python 3.9 이미지 사용
FROM python:3.9-slim

# 작업 디렉토리 설정
WORKDIR /app

# requirements.txt 복사 및 의존성 설치 (캐시 효율성)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
# .dockerignore에 의해 불필요한 파일은 제외됨
COPY . .

# 포트 8000 노출
EXPOSE 8000


# FastAPI 애플리케이션 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]