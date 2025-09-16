# 🛠️ 로컬 개발 환경 설정 가이드

> Docker Compose를 활용한 개발 환경 구축

## 📋 목차
1. [사전 요구사항](#1-사전-요구사항)
2. [환경변수 설정](#2-환경변수-설정)
3. [Docker 컨테이너 실행](#3-docker-컨테이너-실행)
4. [애플리케이션 실행](#4-애플리케이션-실행)
5. [개발 도구 설정](#5-개발-도구-설정)
6. [트러블슈팅](#6-트러블슈팅)

---

## 1. 사전 요구사항

### 1.1 필수 소프트웨어

```bash
# Java 17 (또는 11+)
java -version
# openjdk version "17.0.0" 이상

# Docker & Docker Compose
docker --version
docker-compose --version
# Docker version 20.0+ 권장

# Node.js (프론트엔드 개발 시)
node --version
npm --version
# Node.js 18+ 권장
```

### 1.2 권장 IDE/도구
- **백엔드**: IntelliJ IDEA, VS Code with Java Extension Pack
- **프론트엔드**: VS Code, WebStorm
- **데이터베이스**: DBeaver, MySQL Workbench
- **API 테스트**: Postman, Insomnia
- **Kafka 관리**: Kafka UI (Docker로 자동 실행)

---

## 2. 환경변수 설정

### 2.1 .env 파일 생성

프로젝트 루트의 `back/` 디렉토리에 `.env` 파일 생성:

```bash
cd back/
touch .env
```

### 2.2 .env 파일 내용

```bash
# ===========================================
# 데이터베이스 설정 (로컬 MySQL)
# ===========================================
DB_USERNAME_LOCAL=orakuser
DB_PASSWORD_LOCAL=orak123!@#
DB_NAME_LOCAL=orakgaraki_dev
DB_PORT_LOCAL=3307
DB_URL_LOCAL=jdbc:mysql://localhost:3307/orakgaraki_dev

# ===========================================
# Redis 설정
# ===========================================
REDIS_PASSWORD=redis123!@#
REDIS_PORT=6380
REDIS_URL=redis://localhost:6380

# ===========================================
# Kafka 설정
# ===========================================
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CONSUMER_GROUP=orakgaraki-dev
KAFKA_PORT=9092
KAFKA_UI_PORT=8090

# ===========================================
# AWS 설정 (개발용)
# ===========================================
AWS_ACCESS_KEY_ID=your_dev_access_key
AWS_SECRET_ACCESS_KEY=your_dev_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=orakgaraki-dev-bucket
AWS_EVENTBRIDGE_BUS_NAME=orakgaraki-dev-events

# ===========================================
# JWT 설정
# ===========================================
JWT_SECRET=orakgaraki-super-secret-key-for-development-only
JWT_EXPIRATION=86400000
JWT_REFRESH_EXPIRATION=604800000

# ===========================================
# OAuth2 설정 (개발용)
# ===========================================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/login/oauth2/code/google
OAUTH2_REDIRECT_URI=http://localhost:5173/login/success

# ===========================================
# 기타 설정
# ===========================================
SPRING_PROFILES_ACTIVE=local
ORAK_UPLOAD_PATH=/tmp/orak-upload
```

### 2.3 gitignore 확인

`.env` 파일이 Git에 포함되지 않도록 확인:

```bash
# .gitignore에 다음 내용 확인
*.env
.env.*
!.env.example
```

---

## 3. Docker 컨테이너 실행

### 3.1 Docker Compose 실행

```bash
# back/ 디렉토리에서 실행
cd back/

# 백그라운드에서 모든 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f kafka
docker-compose logs -f mysql
```

### 3.2 컨테이너 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker-compose ps

# 출력 예시:
#        Name                      Command              State           Ports
# -------------------------------------------------------------------------------------
# orakgaraki-kafka     /etc/confluent/docker/run   Up      0.0.0.0:9092->9092/tcp
# orakgaraki-kafka-ui  java -jar kafka-ui.jar      Up      0.0.0.0:8090->8080/tcp
# orakgaraki-mysql     docker-entrypoint.sh mysqld Up      0.0.0.0:3307->3306/tcp
# orakgaraki-redis     docker-entrypoint.sh redis- Up      0.0.0.0:6380->6379/tcp
```

### 3.3 서비스별 헬스체크

```bash
# MySQL 연결 테스트
docker exec -it orakgaraki-mysql mysql -u orakuser -porak123!@# -e "SELECT 1"

# Redis 연결 테스트
docker exec -it orakgaraki-redis redis-cli -a redis123!@# ping

# Kafka 토픽 목록 확인
docker exec -it orakgaraki-kafka kafka-topics --bootstrap-server localhost:9092 --list
```

---

## 4. 애플리케이션 실행

### 4.1 데이터베이스 초기화

```bash
# MySQL에 스키마 생성 (초회 실행 시)
docker exec -it orakgaraki-mysql mysql -u orakuser -porak123!@# -e "
CREATE DATABASE IF NOT EXISTS orakgaraki_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"
```

### 4.2 Kafka 토픽 생성

```bash
# 필요한 토픽들 생성
docker exec -it orakgaraki-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic upload-events --partitions 3 --replication-factor 1

docker exec -it orakgaraki-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic processing-status --partitions 3 --replication-factor 1

docker exec -it orakgaraki-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic processing-results --partitions 3 --replication-factor 1
```

### 4.3 Spring Boot 애플리케이션 실행

```bash
# Gradle 빌드 및 실행
./gradlew clean build -x test
./gradlew bootRun

# 또는 IDE에서 OrakgarakiApplication.java 실행

# 애플리케이션 시작 확인
curl http://localhost:8080/api/actuator/health
```

### 4.4 프론트엔드 실행 (선택사항)

```bash
cd front/

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

---

## 5. 개발 도구 설정

### 5.1 Kafka UI 접속

- **URL**: http://localhost:8090
- **클러스터**: orakgaraki
- **기능**: 토픽, 메시지, 컨슈머 그룹 모니터링

### 5.2 데이터베이스 연결

#### DBeaver 설정
```
Driver: MySQL
Host: localhost
Port: 3307
Database: orakgaraki_dev
Username: orakuser
Password: orak123!@#
```

#### MySQL Workbench 설정
```
Connection Name: Orakgaraki Local
Connection Method: Standard (TCP/IP)
Hostname: localhost
Port: 3307
Username: orakuser
Password: orak123!@#
Default Schema: orakgaraki_dev
```

### 5.3 Redis 연결

#### Redis CLI
```bash
# 로컬 Redis 연결
redis-cli -h localhost -p 6380 -a redis123!@#

# 또는 Docker 컨테이너 내에서
docker exec -it orakgaraki-redis redis-cli -a redis123!@#
```

#### Redis GUI 도구
- **RedisInsight**: Redis Labs 공식 도구
- **Another Redis Desktop Manager**: 오픈소스 GUI

### 5.4 API 문서 접속

```bash
# Swagger UI
http://localhost:8080/api/swagger-ui.html

# OpenAPI 스펙
http://localhost:8080/api/api-docs
```

---

## 6. 트러블슈팅

### 6.1 일반적인 문제들

#### 포트 충돌
```bash
# 사용 중인 포트 확인
netstat -an | grep LISTEN | grep :3307
netstat -an | grep LISTEN | grep :9092

# 포트를 사용하는 프로세스 종료
sudo lsof -ti:3307 | xargs kill -9
```

#### Docker 컨테이너 재시작
```bash
# 모든 컨테이너 재시작
docker-compose restart

# 특정 컨테이너만 재시작
docker-compose restart mysql
docker-compose restart kafka

# 완전히 제거 후 재시작
docker-compose down
docker-compose up -d
```

#### 볼륨 데이터 초기화
```bash
# 모든 데이터 삭제 후 재시작 (주의!)
docker-compose down -v
docker volume prune
docker-compose up -d
```

### 6.2 Kafka 관련 문제

#### 토픽이 생성되지 않을 때
```bash
# Kafka 컨테이너 로그 확인
docker-compose logs kafka

# 토픽 수동 생성
docker exec -it orakgaraki-kafka kafka-topics --create --bootstrap-server localhost:9092 --topic upload-events --partitions 3 --replication-factor 1

# 기존 토픽 삭제 (필요 시)
docker exec -it orakgaraki-kafka kafka-topics --delete --bootstrap-server localhost:9092 --topic upload-events
```

#### 컨슈머 그룹 리셋
```bash
# 컨슈머 그룹 오프셋 리셋
docker exec -it orakgaraki-kafka kafka-consumer-groups --bootstrap-server localhost:9092 --group orakgaraki-dev --reset-offsets --to-earliest --all-topics --execute
```

### 6.3 데이터베이스 문제

#### 연결 실패
```bash
# MySQL 컨테이너 상태 확인
docker-compose ps mysql

# MySQL 로그 확인
docker-compose logs mysql

# 컨테이너 내부 접속하여 디버깅
docker exec -it orakgaraki-mysql bash
mysql -u root -p
```

#### 스키마/테이블 초기화
```sql
-- 개발 DB 완전 초기화 (주의!)
DROP DATABASE IF EXISTS orakgaraki_dev;
CREATE DATABASE orakgaraki_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6.4 애플리케이션 문제

#### Spring Boot 시작 실패
```bash
# 자세한 로그 확인
./gradlew bootRun --debug

# 특정 프로파일로 실행
./gradlew bootRun --args='--spring.profiles.active=local --debug'

# JVM 옵션 추가
./gradlew bootRun -Dspring.profiles.active=local -Xmx2g
```

#### AWS 연결 문제
```bash
# AWS 자격 증명 확인
aws sts get-caller-identity

# S3 버킷 접근 테스트
aws s3 ls s3://orakgaraki-dev-bucket
```

---

## 7. 개발 워크플로우

### 7.1 일일 개발 시작

```bash
# 1. Docker 서비스 시작
docker-compose up -d

# 2. 서비스 상태 확인
docker-compose ps

# 3. Spring Boot 애플리케이션 실행
./gradlew bootRun

# 4. 프론트엔드 실행 (필요시)
cd front && npm run dev
```

### 7.2 개발 완료 후

```bash
# 1. 애플리케이션 종료 (Ctrl+C)

# 2. Docker 서비스 종료 (선택사항)
docker-compose stop

# 3. 리소스 정리 (필요시)
docker-compose down
```

### 7.3 코드 변경 시 테스트

```bash
# 1. 단위 테스트 실행
./gradlew test

# 2. 통합 테스트 실행
./gradlew integrationTest

# 3. API 테스트
curl -X POST http://localhost:8080/api/uploads/presigned-url \
  -H "Content-Type: application/json" \
  -d '{"originalFilename":"test.mp3","contentType":"audio/mpeg","fileSize":1024}'
```

---

## 📚 추가 리소스

### 8.1 유용한 명령어 모음

```bash
# Docker 리소스 사용량 확인
docker stats

# Kafka 메시지 실시간 모니터링
docker exec -it orakgaraki-kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic upload-events --from-beginning

# MySQL 실시간 쿼리 로그
docker exec -it orakgaraki-mysql mysql -u root -p -e "SET GLOBAL general_log = 'ON';"

# Redis 메모리 사용량 확인
docker exec -it orakgaraki-redis redis-cli -a redis123!@# info memory
```

### 8.2 IDE 플러그인 추천

#### IntelliJ IDEA
- **Spring Boot**: Spring 개발 도구
- **Docker**: Docker 컨테이너 관리
- **Database Tools**: 데이터베이스 연결 및 쿼리
- **Kafka Tool**: Kafka 클러스터 관리

#### VS Code
- **Extension Pack for Java**: Java 개발 필수 확장
- **Spring Boot Extension Pack**: Spring 개발 도구
- **Docker**: Docker 컨테이너 관리
- **MySQL**: MySQL 클라이언트
- **Kafka**: Kafka 개발 도구

### 8.3 참고 문서
- [Spring Boot Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)