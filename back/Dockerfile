# 빌드 단계
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Gradle 파일들 복사
COPY build.gradle.kts settings.gradle.kts gradlew ./
COPY gradle gradle/

# 의존성 다운로드
RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon

# 소스코드 복사
COPY src src/

# 애플리케이션 빌드
RUN ./gradlew bootJar --no-daemon

# 런타임 단계
FROM eclipse-temurin:17-jdk

WORKDIR /app

# FFmpeg 설치
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# non-root 사용자 생성
RUN groupadd -r appuser && useradd -r -g appuser appuser

RUN mkdir -p /var/log/orak && chown -R appuser:appuser /var/log/orak
# 빌드 단계에서 JAR 파일 복사
COPY --from=build /app/build/libs/orak-*.jar app.jar

# 소유권 변경
RUN chown -R appuser:appuser /app

# non-root 사용자로 전환
USER appuser

# 포트 노출
EXPOSE 8080 8091

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8091/actuator/health || exit 1

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app/app.jar"]