# 🚀 모니터링 스택 설정 가이드

> Grafana + Prometheus + Loki + Promtail 완전 설정

## 📋 **설정 단계**

### 1️⃣ **환경변수 설정**

```bash
# .env 파일 생성 (back/ 디렉토리에서)
cp .env.example .env

# 필요한 값들 수정
nano .env
```

**주요 환경변수들:**
```bash
# 모니터링 스택
GRAFANA_ADMIN_PASSWORD=grafana123!@#
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
LOKI_PORT=3100

# 데이터베이스
DB_USERNAME_LOCAL=orakuser
DB_PASSWORD_LOCAL=orak123!@#
DB_NAME_LOCAL=orakgaraki_dev

# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CONSUMER_GROUP=orakgaraki-dev
```

### 2️⃣ **로그 디렉토리 생성**

```bash
# 로그 디렉토리 생성
mkdir -p back/logs

# 권한 설정 (Linux/Mac)
chmod 755 back/logs

# Windows에서는 자동 생성됨
```

### 3️⃣ **모니터링 스택 실행**

```bash
# 모든 서비스 시작
cd back/
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d prometheus grafana loki promtail

# 로그 확인
docker-compose logs -f grafana
docker-compose logs -f loki
```

### 4️⃣ **서비스 상태 확인**

```bash
# 컨테이너 상태 확인
docker-compose ps

# 예상 출력:
#        Name                     Command               State           Ports
# ---------------------------------------------------------------------------------
# orakgaraki-grafana    /run.sh                      Up      0.0.0.0:3000->3000/tcp
# orakgaraki-loki       /usr/bin/loki -config.f...   Up      0.0.0.0:3100->3100/tcp
# orakgaraki-prometheus /bin/prometheus --config...   Up      0.0.0.0:9090->9090/tcp
# orakgaraki-promtail   /usr/bin/promtail -confi...   Up
```

### 5️⃣ **Spring Boot 애플리케이션 실행**

```bash
# 애플리케이션 빌드 및 실행
./gradlew clean build -x test
./gradlew bootRun

# 메트릭 엔드포인트 확인
curl http://localhost:8080/api/actuator/prometheus
curl http://localhost:8080/api/actuator/health
```

---

## 🎯 **접속 정보**

| 서비스 | URL | 계정 | 설명 |
|--------|-----|------|------|
| **Grafana** | http://localhost:3000 | admin/grafana123!@# | 통합 대시보드 |
| **Prometheus** | http://localhost:9090 | - | 메트릭 쿼리 |
| **Loki** | http://localhost:3100 | - | 로그 API |
| **Spring Boot** | http://localhost:8080/api | - | 애플리케이션 |
| **Kafka UI** | http://localhost:8090 | - | Kafka 관리 |

---

## 📊 **Grafana 대시보드 설정**

### **1. 초기 접속**
1. http://localhost:3000 접속
2. `admin` / `grafana123!@#` 로그인
3. 좌측 메뉴 → **Dashboards** 클릭

### **2. 자동 구성된 요소들**
- ✅ **Prometheus 데이터소스**: 자동 연결됨
- ✅ **Loki 데이터소스**: 자동 연결됨
- ✅ **통합 대시보드**: 자동 생성됨

### **3. 대시보드 패널들**

#### 📈 **메트릭 패널들**
- **시스템 개요**: 앱 상태, 요청 수, 활성 업로드
- **업로드 처리 현황**: 시작/완료/실패 차트
- **API 응답 시간**: 50th/95th/99th percentile
- **시스템 리소스**: CPU/메모리 사용률
- **데이터베이스**: HikariCP 연결 풀 상태
- **Kafka**: 컨슈머 랙, 처리량

#### 📝 **로그 패널들**
- **실시간 로그 스트림**: ERROR/WARN/INFO 로그
- **에러 로그 분석**: JSON 파싱된 에러 로그
- **시스템 알람 로그**: CRITICAL/FATAL 로그

---

## 🔍 **로그 검색 쿼리 예제**

### **LogQL 기본 쿼리들**

```logql
# 모든 애플리케이션 로그
{job="orakgaraki-app"}

# 에러 로그만
{job="orakgaraki-app"} |= "ERROR"

# 업로드 관련 로그
{job="orakgaraki-app"} |= "upload" or "Upload"

# 특정 시간대 에러 로그
{job="orakgaraki-app"} |= "ERROR" | json | __error__=""

# SQL 쿼리 로그
{job="orakgaraki-app"} |= "Hibernate:"

# 특정 레벨 로그
{job="orakgaraki-app"} | json | level="ERROR"

# 특정 로거 로그
{job="orakgaraki-app"} | json | logger=~".*upload.*"

# 예외 스택트레이스
{job="orakgaraki-app"} |~ "Exception|Error" | json
```

### **고급 LogQL 쿼리들**

```logql
# 5분간 에러 로그 개수
count_over_time({job="orakgaraki-app"} |= "ERROR" [5m])

# 업로드 처리 시간 추출
{job="orakgaraki-app"} |= "upload completed"
  | regexp "took (?P<duration>\\d+)ms"
  | unwrap duration

# 사용자별 업로드 통계
{job="orakgaraki-app"} |= "upload"
  | json
  | __error__=""
  | count by (userId)

# HTTP 상태 코드별 분류
{job="orakgaraki-app"} |= "HTTP"
  | regexp "status=(?P<status>\\d+)"
  | count by (status)
```

---

## 📈 **Prometheus 쿼리 예제**

### **기본 메트릭 쿼리들**

```promql
# 초당 HTTP 요청 수
rate(http_server_requests_seconds_count[5m])

# 평균 응답 시간
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])

# 업로드 성공률
rate(upload_completed_total[5m]) / rate(upload_started_total[5m]) * 100

# 활성 데이터베이스 연결
hikaricp_connections_active

# 메모리 사용률
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# CPU 사용률
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Kafka 컨슈머 랙
kafka_consumer_lag_sum

# JVM 힙 메모리 사용률
jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} * 100
```

### **고급 메트릭 쿼리들**

```promql
# 에러율 (5분 평균)
rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) * 100

# 처리량 추세 (1시간 대비)
rate(upload_completed_total[5m]) / rate(upload_completed_total[1h] offset 1h)

# 디스크 사용률
(1 - node_filesystem_avail_bytes{fstype!="tmpfs"} / node_filesystem_size_bytes{fstype!="tmpfs"}) * 100

# 파일 타입별 업로드 분포
sum by (file_type) (upload_started_total)

# 시간대별 업로드 패턴
sum by (hour) (increase(upload_started_total[1h]))
```

---

## 🚨 **알람 설정**

### **Prometheus Alert Rules**

이미 설정된 알람들:
- ✅ **높은 업로드 실패율** (10% 이상)
- ✅ **처리 큐 적체** (1000개 이상)
- ✅ **데이터베이스 연결 부족** (80% 이상)
- ✅ **높은 메모리 사용률** (90% 이상)
- ✅ **느린 API 응답** (95th percentile > 2초)

### **Grafana 알람 추가하기**

1. **대시보드 패널 편집**
2. **Alert** 탭 클릭
3. **알람 조건 설정**:
   ```
   WHEN avg() OF query(A, 5m, now) IS ABOVE 100
   ```
4. **알림 채널 설정** (Slack/Email/Discord)

---

## 🛠️ **트러블슈팅**

### **일반적인 문제들**

#### 1. **Grafana 대시보드가 비어있음**
```bash
# 데이터소스 연결 확인
curl http://localhost:3100/ready  # Loki
curl http://localhost:9090/-/ready  # Prometheus

# 애플리케이션 메트릭 확인
curl http://localhost:8080/api/actuator/prometheus
```

#### 2. **로그가 수집되지 않음**
```bash
# Promtail 로그 확인
docker-compose logs promtail

# 로그 파일 권한 확인
ls -la back/logs/

# 수동으로 로그 파일 생성
echo "Test log entry" > back/logs/orakgaraki.log
```

#### 3. **메트릭이 나타나지 않음**
```bash
# Spring Boot Actuator 확인
curl http://localhost:8080/api/actuator/health

# Prometheus targets 확인
# http://localhost:9090/targets 접속하여 확인
```

#### 4. **컨테이너 시작 실패**
```bash
# 포트 충돌 확인
netstat -tulpn | grep :3000
netstat -tulpn | grep :9090

# 볼륨 권한 문제
docker-compose down -v
docker-compose up -d
```

---

## 📚 **추가 설정**

### **프로덕션 환경 고려사항**

1. **보안 설정**
   ```yaml
   # docker-compose.yml
   grafana:
     environment:
       GF_SECURITY_SECRET_KEY: "production-secret-key"
       GF_USERS_ALLOW_SIGN_UP: false
       GF_AUTH_ANONYMOUS_ENABLED: false
   ```

2. **데이터 보존 정책**
   ```yaml
   prometheus:
     command:
       - '--storage.tsdb.retention.time=90d'
       - '--storage.tsdb.retention.size=50GB'
   ```

3. **백업 설정**
   ```bash
   # 정기 백업 스크립트
   docker run --rm -v prometheus_data:/data busybox tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz /data
   ```

### **모니터링 확장**

1. **AlertManager 추가** (고급 알람)
2. **Jaeger 연동** (분산 트레이싱)
3. **업타임 모니터링** (Blackbox Exporter)
4. **비즈니스 메트릭** (커스텀 대시보드)

---

**설정 완료! 🎉 이제 완전한 observability 환경을 사용할 수 있습니다.**