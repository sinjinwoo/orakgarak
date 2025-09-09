# 빌드 단계
FROM eclipse-temurin:17-jdk AS build

WORKDIR /app

# Gradle wrapper와 설정 파일들 복사 (캐시 활용)
COPY gradle gradle/
COPY build.gradle.kts settings.gradle.kts gradlew ./

# 의존성 다운로드 (소스 변경 시에도 캐시 활용)
RUN chmod +x ./gradlew && ./gradlew dependencies --no-daemon --parallel

# 소스코드 복사 (마지막에 복사하여 캐시 최적화)
COPY src src/

# 애플리케이션 빌드 (테스트 제외로 속도 향상)
RUN ./gradlew bootJar -x test --no-daemon --parallel

# 런타임 단계 (JRE 사용)
FROM eclipse-temurin:17-jdk

WORKDIR /app

# 필요한 패키지 설치 및 사용자 생성을 한 번에
RUN apt-get update && \
    apt-get install -y curl && \
    rm -rf /var/lib/apt/lists/* && \
    groupadd -r appuser && \
    useradd -r -g appuser appuser && \
    mkdir -p /var/log/orak && \
    chown -R appuser:appuser /var/log/orak

# 환경변수 설정
ENV SPRING_PROFILES_ACTIVE=prod \
    ORAK_LOG_PATH=/var/log/orak \
    JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+UseContainerSupport"

# JAR 파일 복사 및 소유권 설정을 한 번에
COPY --from=build --chown=appuser:appuser /app/build/libs/orak-*.jar app.jar

# non-root 사용자로 전환
USER appuser

# 포트 노출
EXPOSE 8080

# 헬스 체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1

# 애플리케이션 실행
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]