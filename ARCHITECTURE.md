# 🏗️ ORAK GARAKI 시스템 아키텍처 분석서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [네트워크 토폴로지](#네트워크-토폴로지)
3. [Docker Compose 인프라](#docker-compose-인프라)
4. [Python FastAPI 서비스](#python-fastapi-서비스)
5. [Spring Boot 서비스](#spring-boot-서비스)
6. [모니터링 & 관측성 스택](#모니터링--관측성-스택)
7. [데이터 플로우](#데이터-플로우)
8. [보안 구성](#보안-구성)
9. [아키텍처 권장사항](#아키텍처-권장사항)

---

## 🎯 시스템 개요

### 🏢 ORAK GARAKI 완전체 아키텍처 (CloudCraft 스타일)

```
                                         🌐 Internet (HTTPS/TLS 1.3)
                                                      │
                            ┌─────────────────────────▼─────────────────────────┐
                            │                🔥 EC2 Server                      │ ← 🖥️ Ubuntu 22.04 LTS
                            │              j13c103.p.ssafy.io                   │    💪 Host Level Services
                            │                                                   │    🔧 Single Point Entry
                            └───────────────────────────┬───────────────────────┘
                                                        │
                 ┌──────────────────────────────────────▼──────────────────────────────────────┐
                 │                          🌐 Nginx (Gateway)                                 │ ← 🚪 Entry + SSL + Static
                 │     SSL Termination + React Static Files + API Reverse Proxy              │    📋 Port: 443/80
                 │                        📁 /var/www/html                                    │    🔒 Let's Encrypt
                 │  🔧 Rate Limiting + Security Headers + Large File Upload (500MB)          │    🛡️ WAF Protection
                 └─┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
                   │          │          │          │          │          │
            ┌──────▼─────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼─────────────┐
            │     /      │ │  /api/ │ │/jenkins│ │  /n8n/ │ │/grafana│ │  /prometheus/  │ ← 🔧 Route Mapping
            │   React    │ │Spring  │ │ :9090  │ │ :5678  │ │ :3000  │ │    :9090       │    📦 Proxy Pass
            │  (Static)  │ │Boot API│ │ (Host) │ │ (Host) │ │(Docker)│ │   (Docker)     │    🔗 Load Balancing
            └────────────┘ └────┬───┘ └────────┘ └────────┘ └────────┘ └────────────────┘
                                │
                                ▼
      ┌─────────────────────────────────────────────────┐
      │                🐳 Docker Network                  │ ← 🌉 Container Bridge
      │              orakgaraki-network                   │    🔧 Internal Communication
      └─┬──────┬────────┬───────────┬───────────┬────────┬─┘
        │      │        │           │           │        │
   ┌────▼─────┐▼─────┐┌───▼─────┐ ┌───▼─────┐ ┌───▼─────┐ ┌───▼──────────────────────────┐
   │☕ Spring ││🗄️MySQL││🔴 Redis │ │📨 Kafka │ │🔧 Kafka │ │      📊 Full Monitoring      │ ← 💾 Data + App Layer
   │Boot (app)││  :3306││  :6379  │ │  :9092  │ │UI :8090 │ │           Stack              │    🔒 Network Isolation
   │   :8080  ││       ││         │ │ (KRaft) │ │         │ │                              │    🚀 High Performance
   │          ││MySQL  ││Redis 7  │ │Mode     │ │Web UI   │ │  ┌─────────┬─────────────┐   │
   │🎯 API Gtw││8.0    ││Alpine   │ │Auto     │ │         │ │  │Prometh  │   Grafana   │   │
   │📨 Kafka  ││Engine ││         │ │Create   │ │         │ │  │eus      │   :3000     │   │ ← 🔍 Observability
   │📡 DLQ    ││InnoDB ││         │ │         │ │         │ │  │ :9090   │   Dashboard │   │    📈 Real-time Metrics
   │🔄 SSE    ││       ││         │ │         │ │         │ │  └─────────┴─────────────┘   │    🚨 Alerting System
   └────┬─────┘└───┬───┘└───┬─────┘ └───┬─────┘ └─────────┘ │  ┌─────────┬─────────────┐   │
        │          │        │           │                   │  │  Loki   │Alertmanager │   │
        ▼          ▼        ▼           ▼                   │  │ :3100   │   :9093     │   │
   ┌─────────┬─────────┬─────────┬─────────────────────────┐ │  │Log Agg  │Mattermost   │   │ ← 📝 Log Management
   │Spring   │MySQL    │Redis    │Kafka     │Node    │cAdv│ │  └─────────┴─────────────┘   │    🔔 Alert Routing
   │Boot     │Exporter │Exporter │Exporter  │Export  │isor│ │  ┌─────────────────────────┐   │
   │Actuator │:9104    │:9121    │:9308     │:9100   │8081│ │  │       Promtail          │   │
   │:8080    │         │         │          │        │    │ │  │    Log Collection       │   │
   └─────────┴─────────┴─────────┴─────────────────────────┘ │  │   Spring Boot Logs      │   │
                                                           │  │   System + Docker       │   │
                                                           └──┴─────────────────────────┴───┘
                                │
                                ▼
                   ┌─────────────────────────────────────┐
                   │     🌉 Docker Network Bridge        │ ← 🔗 Inter-Network Communication
                   │                                     │    🔧 Spring Boot (Container) ←→
                   │  orakgaraki-network ←→ External     │    🔧 back_orakgaraki-network
                   │                                     │    📡 HTTP API Bridge
                   │  Spring Boot :8080 ←→ Python :8000 │    📨 Event-Driven Architecture
                   └──────────────────┬──────────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │ 🐍 Python FastAPI       │ ← 🧠 AI/ML Processing Engine
                         │   :8000 (Container)     │    🎵 Audio Analysis Pipeline
                         │                         │    🤖 Machine Learning Models
                         │  ┌─────────────────┐    │    📦 /app/models (Volume)
                         │  │ data-service    │    │    🏥 Health Check Enabled
                         │  │ Audio Analysis  │    │    🔄 RESTful API
                         │  │ + librosa       │    │    ⚡ Async Processing
                         │  │ + ML Pipeline   │    │
                         │  │ + Pinecone SDK  │    │
                         │  └─────────────────┘    │
                         └─────────────────────────┘
                                │
                                ▼
                    🌲 Pinecone Vector Database ← ☁️ External SaaS Service
                      Audio Embeddings Storage      🧠 Similarity Search
                      Vector Similarity Search      🔐 API Key Authentication
                      Real-time Query Engine        📊 Performance Analytics

═══════════════════════════════════════════════════════════════════════════════════

                            ☁️ External Services & CI/CD Pipeline

    ┌─────────────────┐         📡 Git Webhook           ┌─────────────────┐
    │   📦 GitLab     │ ─────────────────────────────────▶│  🛠️ Jenkins     │ ← 🏗️ CI/CD Engine
    │   Repository    │ ← 🔄 Source Code Management      │    :9090        │    📋 Pipeline Automation
    │ git.ssafy.com   │   🚀 Push Event Triggers         │ (EC2 Host)      │    🔧 Build + Test + Deploy
    │                 │   🌳 Branch Protection           │                 │    📊 Build History
    │ ┌─────────────┐ │   🔒 Access Control              │ ┌─────────────┐ │    🚨 Failure Notifications
    │ │   Backend   │ │                                  │ │  Frontend   │ │
    │ │(Spring Boot)│ │                                  │ │   Build     │ │ ← 🎨 Frontend Pipeline
    │ │   Source    │ │                                  │ │npm run build│ │    📦 Webpack Bundle
    │ └─────────────┘ │                                  │ └─────────────┘ │    🗜️ Asset Optimization
    │ ┌─────────────┐ │                                  │ ┌─────────────┐ │
    │ │   Python    │ │                                  │ │  Deployment │ │
    │ │(FastAPI AI) │ │                                  │ │   Script    │ │ ← 🚀 Auto Deployment
    │ │   Source    │ │                                  │ │   to Nginx  │ │    📁 /var/www/html
    │ └─────────────┘ │                                  │ └─────────────┘ │    🔄 Zero Downtime
    └─────────────────┘                                  └─────────┬───────┘
                                                                   │
                                                        ┌──────────▼──────────┐
                                                        │   🔧 n8n Workflow  │ ← 🔄 Automation Platform
                                                        │     :5678 (Host)    │    📋 Task Orchestration
                                                        │                     │    🔗 Service Integration
                                                        │ ┌─────────────────┐ │    ⏰ Scheduled Jobs
                                                        │ │ Workflow Engine │ │    📊 Execution History
                                                        │ │ Task Scheduler  │ │    🚨 Error Handling
                                                        │ │ Data Pipeline   │ │
                                                        │ │ Notifications   │ │
                                                        │ └─────────────────┘ │
                                                        └─────────────────────┘

                                    🔄 Data Flow Summary
    ┌─────────────────────────────────────────────────────────────────────────────┐
    │ 👤 User → 🌐 Nginx → ☕ Spring Boot → 📨 Kafka → 🐍 Python → 🌲 Pinecone    │
    │                ↓                        ↓              ↓           ↓        │
    │            📁 Static           📊 Monitoring      🗄️ MySQL    🔍 Search     │
    │             Files              📈 Metrics         💾 Store     📊 Analytics │
    └─────────────────────────────────────────────────────────────────────────────┘

Technology Stack Summary:
Frontend: React (Static) | Backend: Spring Boot (Java) + FastAPI (Python)
Database: MySQL 8.0 + Redis 7 + Pinecone Vector DB
Message Queue: Apache Kafka (KRaft Mode) | Reverse Proxy: Nginx
Monitoring: Prometheus + Grafana + Loki + Alertmanager | CI/CD: GitLab → Jenkins
Container: Docker Compose | Automation: n8n | SSL: Let's Encrypt
```

### 기술 스택
- **Frontend**: React (정적 빌드, Nginx 제공)
- **Backend API**: Spring Boot (Java, Host Level)
- **Data Processing**: FastAPI (Python) + librosa
- **Database**: MySQL 8.0
- **Cache**: Redis 7
- **Message Queue**: Apache Kafka (KRaft mode)
- **Vector DB**: Pinecone
- **Monitoring**: Prometheus + Grafana + Loki + Alertmanager
- **Reverse Proxy**: Nginx
- **Container**: Docker Compose
- **CI/CD**: GitLab → Jenkins
- **Workflow Automation**: n8n

---

## 🌉 네트워크 토폴로지

### Docker 네트워크 구조
```yaml
네트워크 분리:
  # 주 백엔드 네트워크 (default)
  orakgaraki-network:
    - Spring Boot (Host Level에서 Docker 연결)
    - MySQL :3306
    - Redis :6379
    - Kafka :9092
    - 모니터링 스택 (Prometheus, Grafana, Loki, etc.)
    - 모든 Exporters

  # Python 서비스 전용 네트워크 (external)
  back_orakgaraki-network:
    external: true
    - Python FastAPI :8000 (data-service)
    - orakgaraki-network과 연결

EC2 Host Level:
  - Nginx :443/:80 (SSL + Static Files)
  - Spring Boot :8080 (API Gateway)
  - Jenkins :9090 (CI/CD)
  - n8n :5678 (Workflow)
```

### 포트 매핑 구조
```yaml
External Access (Nginx Proxy):
  :443/:80 → Nginx (SSL + React Static)
  /api/* → Spring Boot :8080
  /jenkins/* → Jenkins :9090
  /n8n/* → n8n :5678

Internal Docker Services:
  MySQL: 3306:3306
  Redis: 6379:6379
  Kafka: 9092:9092
  Python FastAPI: 8000:8000

Monitoring Stack:
  Prometheus: 9090:9090
  Grafana: 3000:3000
  Loki: 3100:3100
  Alertmanager: 9093:9093
  Kafka UI: 8090:8080

Service Exporters:
  Node Exporter: 9100:9100
  cAdvisor: 8081:8080
  MySQL Exporter: 9104:9104
  Redis Exporter: 9121:9121
  Kafka Exporter: 9308:9308
```

---

## 🐳 Docker Compose 인프라

### 메인 백엔드 서비스 (back/docker-compose.yml)

#### 핵심 데이터 서비스
```yaml
# 데이터베이스
mysql:
  image: mysql:8.0
  container_name: orakgaraki-mysql
  ports: ["3306:3306"]
  environment:
    - MYSQL_ROOT_PASSWORD=${DB_PASSWORD_LOCAL}
    - MYSQL_DATABASE=${DB_NAME_LOCAL}
    - MYSQL_USER=${DB_USERNAME_LOCAL}
  volumes:
    - mysql_data:/var/lib/mysql
    - ./mysql-init:/docker-entrypoint-initdb.d:ro
  healthcheck:
    test: mysqladmin ping (10초 간격, 최대 10회 재시도)

# 캐시 레이어
redis:
  image: redis:7-alpine
  container_name: orakgaraki-redis
  ports: ["6379:6379"]
  command: redis-server --requirepass ${REDIS_PASSWORD}
  volumes:
    - redis_data:/data

# 메시지 큐 (KRaft Mode)
kafka:
  image: apache/kafka:latest
  container_name: orakgaraki-kafka
  ports: ["9092:9092"]
  environment:
    - KRaft mode (Zookeeper 없음)
    - Auto topic creation 활성화
    - G1GC 최적화 설정
  volumes:
    - kafka_data:/opt/kafka/logs
  healthcheck:
    test: kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

#### 완전한 모니터링 스택
```yaml
# 메트릭 수집 및 저장
prometheus:
  image: prom/prometheus:latest
  ports: ["9090:9090"]
  configuration:
    - 30일 데이터 보존
    - 관리 API 활성화
    - Spring Boot Actuator 수집
    - 동적 구성 생성 (envsubst)

# 시각화 대시보드
grafana:
  image: grafana/grafana:latest
  ports: ["3000:3000"]
  features:
    - Dark 테마 기본
    - 익명 접근 비활성화
    - 자동 대시보드 프로비저닝
    - 플러그인 관리 비활성화 (보안)

# 로그 집계 시스템
loki:
  image: grafana/loki:latest
  ports: ["3100:3100"]
  features:
    - 로그 인덱싱 및 검색
    - 압축 저장
    - 동적 구성 생성

promtail:
  image: grafana/promtail:latest
  volumes:
    - ../back/logs:/var/log/app:ro  # Spring Boot 로그
    - /var/log:/var/log/host:ro     # 시스템 로그
    - /var/lib/docker/containers:/var/lib/docker/containers:ro

# 알림 관리
alertmanager:
  image: prom/alertmanager:latest
  ports: ["9093:9093"]
  integrations:
    - Mattermost 웹훅
    - 동적 구성 생성
```

#### 메트릭 Exporters
```yaml
# 시스템 메트릭
node-exporter:
  ports: ["9100:9100"]
  metrics: [CPU, 메모리, 디스크, 네트워크]

# 컨테이너 메트릭
cadvisor:
  ports: ["8081:8080"]
  privileged: true
  metrics: [Docker 컨테이너 리소스 사용량]

# 데이터베이스 메트릭
mysql-exporter:
  ports: ["9104:9104"]
  connection: "mysql:3306"

redis-exporter:
  ports: ["9121:9121"]
  connection: "redis://redis:6379"

kafka-exporter:
  ports: ["9308:9308"]
  connection: "kafka:29092"

# 관리 UI
kafka-ui:
  ports: ["8090:8080"]
  connection: "kafka:29092"
```

### Python 서비스 (python/docker-compose.yml)

```yaml
data-service:
  build: .
  image: data-service:latest
  container_name: data-service
  ports: ["8000:8000"]
  networks:
    - back_orakgaraki-network  # 외부 브리지 네트워크
  volumes:
    - ./models:/app/models     # AI 모델 캐시
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s

networks:
  back_orakgaraki-network:
    external: true
    driver: bridge
```

---

## 🐍 Python FastAPI 서비스

### 서비스 역할
- **음성 분석 엔진**: librosa 기반 오디오 특성 추출
- **ML 파이프라인**: AI 모델을 통한 음성 분석
- **벡터 데이터베이스**: Pinecone 연동 및 유사도 검색
- **API 엔드포인트**: RESTful API 제공

### 핵심 기능 (추정)
```python
# 음성 분석 서비스
class AudioAnalysisService:
    def __init__(self):
        self.librosa = librosa
        self.pinecone_client = pinecone.init()

    async def analyze_audio(self, file_path: str):
        # 1. librosa를 통한 오디오 특성 추출
        audio, sr = librosa.load(file_path)
        features = librosa.feature.mfcc(y=audio, sr=sr)

        # 2. AI 모델을 통한 분석 및 임베딩 생성
        embeddings = self.model.encode(features)

        # 3. Pinecone 벡터 저장
        self.pinecone_client.upsert(vectors=embeddings)

        # 4. 분석 결과 반환
        return analysis_result
```

### API 엔드포인트
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "data-service"}

@app.post("/analyze/audio")
async def analyze_audio_file(file: UploadFile):
    # 음성 파일 분석 처리
    # Kafka를 통한 Spring Boot 통신

@app.get("/search/similar")
async def search_similar_audio(query_vector: List[float]):
    # Pinecone 벡터 유사도 검색
    results = pinecone_client.query(vector=query_vector, top_k=10)
    return results
```

### 네트워크 연결
```yaml
network_mode: bridge
networks:
  - back_orakgaraki-network (external: true)

# Spring Boot ←→ Python FastAPI 통신
- HTTP REST API 호출
- Kafka 메시지 기반 비동기 통신
- Docker 네트워크 간 연결
```

---

## ☕ Spring Boot 서비스

### DLQ (Dead Letter Queue) 아키텍처

#### Kafka 이벤트 처리
```java
@Service
public class KafkaEventService {

    // 메인 오디오 처리 토픽
    @KafkaListener(topics = "audio.processing")
    public void processAudio(AudioEvent event) {
        try {
            // 1. 오디오 파일 메타데이터 검증
            validateAudioFile(event.getFileId());

            // 2. Python FastAPI 서비스 호출
            AudioAnalysisResult result = pythonServiceClient.analyzeAudio(event);

            // 3. 처리 결과 저장
            saveAnalysisResult(result);

            // 4. 실시간 상태 업데이트 (SSE)
            sseService.sendStatusUpdate(event.getUserId(), "COMPLETED");

        } catch (Exception e) {
            log.error("Audio processing failed: {}", e.getMessage());
            // DLQ로 재시도 메시지 전송
            kafkaTemplate.send("audio.processing.dlq", event);
        }
    }

    // DLQ 처리 로직
    @KafkaListener(topics = "audio.processing.dlq")
    public void processDLQ(AudioEvent event) {
        try {
            // 재시도 횟수 확인
            if (event.getRetryCount() < MAX_RETRY_COUNT) {
                // 지연 후 재처리
                Thread.sleep(event.getRetryCount() * 5000);
                processAudio(event.incrementRetry());
            } else {
                // 최종 실패 처리
                handleFinalFailure(event);
            }
        } catch (Exception e) {
            log.error("DLQ processing failed: {}", e.getMessage());
            alertService.sendCriticalAlert("DLQ_PROCESSING_FAILED", event);
        }
    }
}
```

#### 배치 처리 시스템
```java
@Service
public class BatchProcessingService {

    @Scheduled(fixedRate = 300000) // 5분마다 실행
    public void processBatch() {
        log.info("Starting batch processing...");

        // 1. 대기중인 작업 조회
        List<PendingTask> pendingTasks = taskRepository.findPendingTasks();

        // 2. 배치 단위로 그룹화
        Map<String, List<PendingTask>> batchGroups =
            pendingTasks.stream().collect(Collectors.groupingBy(PendingTask::getTaskType));

        // 3. 각 배치 그룹 처리
        batchGroups.forEach((taskType, tasks) -> {
            CompletableFuture.runAsync(() -> processBatchGroup(taskType, tasks));
        });

        // 4. 배치 처리 메트릭 업데이트
        meterRegistry.counter("batch.processing.completed").increment();
    }

    private void processBatchGroup(String taskType, List<PendingTask> tasks) {
        // Python 서비스와 배치 통신
        BatchProcessingRequest request = BatchProcessingRequest.of(tasks);
        BatchProcessingResponse response = pythonServiceClient.processBatch(request);

        // 결과 일괄 저장
        batchResultRepository.saveAll(response.getResults());
    }
}
```

### API 엔드포인트 구조
```java
@RestController
@RequestMapping("/api")
public class ProcessingController {

    // 음성 파일 업로드 및 처리 요청
    @PostMapping("/records/upload")
    public ResponseEntity<UploadResponse> uploadAudio(
        @RequestParam("file") MultipartFile file,
        @RequestParam("metadata") String metadata) {

        // 1. 파일 검증 및 저장
        String fileId = fileService.saveUploadedFile(file);

        // 2. Kafka로 처리 요청
        AudioEvent event = AudioEvent.builder()
            .fileId(fileId)
            .metadata(metadata)
            .userId(getCurrentUserId())
            .timestamp(Instant.now())
            .build();

        kafkaTemplate.send("audio.processing", event);

        // 3. 처리 ID 반환
        return ResponseEntity.ok(UploadResponse.of(fileId));
    }

    // 실시간 처리 상태 (SSE)
    @GetMapping(value = "/processing/status/{id}",
                produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getProcessingStatus(@PathVariable String id) {
        SseEmitter emitter = new SseEmitter(35 * 60 * 1000L); // 35분 타임아웃

        // SSE 연결 등록
        sseService.registerEmitter(id, emitter);

        // 현재 상태 즉시 전송
        ProcessingStatus currentStatus = statusService.getCurrentStatus(id);
        sseService.sendEvent(emitter, "status", currentStatus);

        return emitter;
    }

    // EventBridge 비동기 완료 웹훅
    @PostMapping("/records/async/upload-completed")
    public ResponseEntity<Void> handleUploadCompleted(
        @RequestBody EventBridgeNotification notification) {

        // AWS EventBridge에서 오는 알림 처리
        String fileId = notification.getDetail().getFileId();
        processAsyncUploadCompletion(fileId);

        return ResponseEntity.ok().build();
    }

    // Alertmanager 웹훅
    @PostMapping("/webhook/alertmanager")
    public ResponseEntity<Void> handleAlert(
        @RequestBody AlertmanagerWebhook alert) {

        // Prometheus 알림 처리
        alertService.processIncomingAlert(alert);

        return ResponseEntity.ok().build();
    }
}
```

### 모니터링 통합
```java
@Component
public class MetricsConfiguration {

    @Bean
    public MeterRegistry meterRegistry() {
        return Metrics.globalRegistry;
    }

    // 커스텀 메트릭 정의
    @EventListener
    public void handleAudioProcessingEvent(AudioProcessingEvent event) {
        Timer.Sample sample = Timer.start(meterRegistry);

        if (event.getStatus() == ProcessingStatus.COMPLETED) {
            sample.stop(Timer.builder("audio.processing.duration")
                .description("Audio processing duration")
                .tag("status", "success")
                .register(meterRegistry));

            meterRegistry.counter("audio.processing.success").increment();
        } else if (event.getStatus() == ProcessingStatus.FAILED) {
            meterRegistry.counter("audio.processing.failure").increment();
        }
    }
}
```

---

## 📊 모니터링 & 관측성 스택

### Prometheus 메트릭 수집
```yaml
전체 메트릭 커버리지:
  Application Metrics:
    - Spring Boot Actuator (/actuator/prometheus)
    - 커스텀 비즈니스 메트릭
    - HTTP 요청/응답 메트릭
    - 데이터베이스 커넥션 풀

  Infrastructure Metrics:
    - Node Exporter: 시스템 리소스
    - cAdvisor: Docker 컨테이너
    - MySQL Exporter: 데이터베이스 성능
    - Redis Exporter: 캐시 성능
    - Kafka Exporter: 메시지 큐 상태

  수집 주기:
    - 기본 스크래핑: 15초
    - 데이터 보존: 30일
    - 고가용성: 단일 인스턴스 (개발환경)
```

### Grafana 대시보드
```yaml
자동 프로비저닝 대시보드:
  - System Overview: 전체 시스템 상태
  - Application Performance: Spring Boot 메트릭
  - Database Performance: MySQL/Redis 상태
  - Container Resources: Docker 리소스 사용량
  - Business Metrics: 음성 처리 현황
  - Alert Status: 현재 알림 상태

보안 설정:
  - 관리자 계정: ${GRAFANA_ADMIN_USER}
  - 익명 접근 비활성화
  - 플러그인 관리 제한
  - Dark 테마 기본 설정
```

### Loki 로그 시스템
```yaml
로그 수집 범위:
  Spring Boot Logs:
    - Application 로그: /var/log/app
    - 에러 로그, 액세스 로그
    - 구조화된 JSON 로그 포맷

  System Logs:
    - /var/log (시스템 로그)
    - Docker Container 로그
    - Nginx 액세스/에러 로그

  로그 보존 정책:
    - 압축 저장
    - 인덱스 기반 검색
    - Grafana 통합 쿼리
```

### 알림 시스템 (Alertmanager)
```yaml
알림 규칙:
  Critical:
    - 서비스 다운 (즉시 알림)
    - 데이터베이스 연결 실패
    - 디스크 용량 부족 (90%+)
    - 메모리 부족 (95%+)

  Warning:
    - 높은 응답시간 (>5초)
    - 에러율 증가 (>5%)
    - 큐 백로그 증가

  알림 채널:
    - Mattermost 웹훅 통합
    - 알림 그룹화 및 억제
    - 에스컬레이션 정책
```

---

## 🔄 데이터 플로우

### 음성 처리 워크플로우 (CloudCraft 스타일) - AWS S3 + EventBridge 아키텍처

```
👤 User Request Upload (Frontend)
        │
        ▼
🌐 Nginx → ☕ Spring Boot (:8080) ← 🚀 /api/records/presigned-url
        │                            🔧 Generate S3 Presigned URL
        │                            💾 Create DB Record (PENDING)
        ▼
📋 Return Presigned URL ← 🔗 S3 Bucket + Object Key
        │                   ⏱️ 15min expiration
        │                   🔐 Temporary upload permission
        ▼
👤 Client Direct Upload ← 📤 Direct to S3 (500MB max)
        │                  🚀 Bypass Server Load
        │                  ⚡ High Performance Upload
        ▼
☁️ AWS S3 Bucket ← 📁 Audio File Storage
   (orakgaraki-audio)   🔧 Event Notification Enabled
        │               📊 Object Created Event
        ▼
🌉 AWS EventBridge ← 📡 S3 Event Notification
   (Event Router)     🔧 Event Pattern Matching
        │             ⚡ Real-time Event Processing
        │             🎯 Rule: s3:ObjectCreated:*
        ▼
☕ Spring Boot Webhook ← 🪝 POST /api/records/async/upload-completed
        │                    🔧 EventBridge HTTP Target
        │                    🛡️ AWS IP Whitelist Validation
        │                    📋 Event: {bucket, key, size, timestamp}
        ▼
🗄️ Database Update ← 💾 Update Record Status (UPLOADED)
        │               🔧 File Metadata Storage
        │               ⏱️ Upload Timestamp
        ▼
📨 Kafka Producer ← 📝 Topic: audio.processing
        │              🔧 Event: {s3Key, bucketName, userId, metadata}
        │              🎯 Partition by userId
        │              🚀 Async Processing Queue
        ▼
🔄 Kafka Consumer (DLQ Pattern) ← 🔧 Batch Size Control
        │                         ⚙️ Max Concurrent Processing
        │                         📊 Throughput Management
    ┌───▼───────────────────────────┐
    │         Success Path          │              🚨 Failure Path
    └───┬───────────────────────────┘                    │
        ▼                                                ▼
🐍 Python FastAPI (:8000) ← 🌐 HTTP REST Call    📨 audio.processing.dlq
        │                     🔧 POST /analyze         │
        │                     📥 Download from S3      │
        │                     🏃 Async Processing       │
        ▼                                              │
🎵 librosa + AI Analysis ← 🧠 Feature Extraction        │
        │                   📥 S3 File Download        │
        │                   🔧 MFCC, Spectral         │
        │                   🤖 ML Model Inference     │
        ▼                                              │
┌───────────────────┬────────────────┐                 │
│                   │                │                 │
▼                   ▼                ▼                 │
🌲 Pinecone        🗄️ MySQL         📊 Prometheus       │
Vector Upsert       Result Store    Metrics Update    │
🔧 Embeddings      🔧 Metadata      🔧 Success Count   │
🔍 Similarity      🎯 Status        ⏱️ Duration        │
└──────────────────────┬─────────────────────────────────┘
                       ▼                               │
               📡 Kafka Response ← 🔄 Processing Complete │
                       │                               │
                       ▼                               │
            ☕ Spring Boot Consumer                      │
                       │                               │
                       ▼                               │
            🗄️ Update DB Status ← 💾 COMPLETED/FAILED    │
                       │                               │
                       ▼                               │
            📡 SSE Status Update ← ⚡ Real-time        │
                       │          🔧 Server-Sent       │
                       ▼             Events           │
            🎨 Frontend Update ← 💫 Live Status        │
                                   🔄 Progress Bar      │
                                   📊 Analysis Results  │
                                                       │
🚨 DLQ Flow (Error Recovery):                           │
📨 Main Topic Failed ──────────────────────────────────┘
        │
        ▼
📨 audio.processing.dlq ← 🔄 Retry Logic
        │                   ⏱️ Exponential Backoff
        │                   🔢 Max 3 Retries
        │                   🎛️ Load Control
        ▼
    ┌─────────┐
    │Retry #N │ ← 🔄 Re-process with Delay
    └─────┬───┘
          │
      ┌───▼───────────┐
      │   Success?    │
      └─┬─────────────┘
        │No (Final)
        ▼
📧 Manual Review ← 🚨 Critical Alert
   🔧 Admin Dashboard
   📊 Failure Analytics
   🗄️ Dead Letter Storage

🔧 Processing Load Control:
┌─────────────────────────────────────────────────────────┐
│ ⚙️ Kafka Consumer Configuration                        │
│ • Max Concurrent Processing: 5-10 files              │
│ • Batch Size: 3-5 records per poll                   │
│ • Processing Timeout: 5 minutes                      │
│ • Memory Management: 2GB per worker                  │
│                                                     │
│ 📊 Adaptive Scaling Based on:                       │
│ • Queue Depth Monitoring                            │
│ • Processing Success Rate                           │
│ • System Resource Usage                             │
│ • Average Processing Time                           │
└─────────────────────────────────────────────────────────┘
```

### 배치 처리 플로우
```
⏰ Scheduled Job (Every 5min) → 🔍 MySQL Query → 📋 Pending Records
        ↓
🔄 Batch Grouping (By Task Type) → 🧵 Parallel Processing
        ↓
🐍 Python Batch API → 🎵 Bulk Analysis → 🌲 Pinecone Bulk Upsert
        ↓
📊 Results Aggregation → 💾 Database Update → 📈 Metrics Reporting
```

### 실시간 모니터링 플로우
```
Application → Actuator/Prometheus → Prometheus → Grafana Dashboard
     ↓                                    ↓
   Logs → Promtail → Loki → Grafana Logs
     ↓                                    ↓
  Metrics → Alert Rules → Alertmanager → Mattermost
```

---

## 🔒 보안 구성

### 네트워크 보안 정책
```yaml
접근 제어 매트릭스:
  Public Access (Internet):
    - Frontend Static Files (/)
    - Spring Boot API (/api/*)
    - SSL 인증서 갱신 (/.well-known/acme-challenge/)

  인증 기반 접근:
    - Grafana Dashboard (/grafana/)
    - Prometheus Web UI (/prometheus/)
    - Jenkins CI/CD (/jenkins/)
    - n8n Workflow (/n8n/)
    - Kafka UI (/kafka-ui/)

  내부 네트워크 Only:
    - Spring Boot Actuator (/actuator/)
    - All Exporters (Node, MySQL, Redis, Kafka)
    - Container Management APIs

  AWS IP 화이트리스트:
    - EventBridge Webhook Endpoint
    - 한국 리전: 13.124.0.0/16, 13.125.0.0/16
    - 글로벌: 3.0.0.0/8, 52.0.0.0/8, 54.0.0.0/8
```

### Nginx 보안 헤더
```nginx
# 보안 헤더 설정
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";

# Rate Limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;

# 대용량 파일 업로드
client_max_body_size 500M;
client_body_timeout 300s;
client_header_timeout 60s;
```

### 데이터 보안
```yaml
Secrets Management:
  현재 구성:
    - .env 파일 기반 환경변수
    - Docker secrets 미사용

  개선 필요사항:
    - HashiCorp Vault 도입
    - Kubernetes Secrets (K8s 마이그레이션 시)
    - 암호화된 설정 파일

데이터베이스 보안:
  MySQL:
    - Root 패스워드 보호
    - 사용자별 권한 분리
    - 네트워크 격리 (Docker)

  Redis:
    - AUTH 인증 필수
    - 패스워드 복잡도 정책
    - 메모리 덤프 암호화

컨테이너 보안:
  Current Issues:
    - Kafka user "0:0" (root 권한)
    - cAdvisor privileged mode
    - 서명되지 않은 컨테이너 이미지

  Recommendations:
    - 최소 권한 원칙 적용
    - 컨테이너 스캔 도구 (Trivy, Clair)
    - 보안 정책 자동화
    - 런타임 보안 모니터링
```

---

## 🎯 아키텍처 권장사항

### 1. 성능 최적화
```yaml
Application Layer:
  Spring Boot:
    - HikariCP 커넥션 풀 튜닝
      * maximumPoolSize: 20
      * minimumIdle: 5
      * connectionTimeout: 30000
    - JVM 옵션 최적화
      * -Xms2g -Xmx4g
      * -XX:+UseG1GC
      * -XX:MaxGCPauseMillis=200
    - Redis 캐시 전략 개선
      * 자주 조회되는 메타데이터 캐싱
      * TTL 정책 최적화

  Python Service:
    - FastAPI 비동기 처리 확대
    - GPU 가속 고려 (CUDA)
    - 모델 로딩 최적화 (lazy loading)
    - 배치 처리 크기 최적화

Database Layer:
  MySQL:
    - 인덱스 최적화
      * 복합 인덱스 전략
      * 쿼리 실행 계획 분석
    - 읽기 전용 복제본 구성
    - 파티셔닝 전략 (날짜 기반)
    - 버퍼 풀 크기 최적화

  Redis:
    - 메모리 사용량 최적화
    - 데이터 만료 정책 개선
    - 클러스터링 고려
```

### 2. 확장성 개선
```yaml
Horizontal Scaling:
  Service Level:
    - Spring Boot 다중 인스턴스
      * Load Balancer (Nginx upstream)
      * Session 공유 (Redis)
      * 상태 없는 설계 (Stateless)

    - Python 서비스 스케일링
      * 컨테이너 복제
      * 로드밸런싱
      * 큐 기반 작업 분산

  Infrastructure Scaling:
    - Kafka 클러스터링
      * 다중 브로커
      * 파티션 최적화
      * 복제 팩터 조정

    - Database Scaling
      * MySQL 마스터-슬레이브 구성
      * 샤딩 전략 수립
      * 연결 풀 분산

Container Orchestration:
  Kubernetes 마이그레이션:
    - 오토스케일링 (HPA, VPA)
    - 서비스 메시 (Istio)
    - 지속적 배포 (ArgoCD)
    - 설정 관리 (ConfigMaps, Secrets)
```

### 3. 보안 강화
```yaml
Zero Trust Architecture:
  Network Security:
    - 마이크로세그멘테이션
    - VPN/Bastion Host 도입
    - WAF (Web Application Firewall)
    - DDoS 보호

  Authentication & Authorization:
    - OAuth2/OIDC 인증
    - JWT 토큰 기반 인가
    - RBAC (Role-Based Access Control)
    - API 게이트웨이 도입

  Data Protection:
    - 데이터 암호화 (저장/전송)
    - 민감 정보 마스킹
    - 백업 데이터 암호화
    - 접근 로그 감사

Container Security:
  - 이미지 스캐닝 파이프라인
  - 런타임 보안 모니터링
  - 정책 기반 실행 제어
  - 보안 컨텍스트 강화
```

### 4. 운영 개선
```yaml
Observability Enhancement:
  Distributed Tracing:
    - Jaeger/Zipkin 도입
    - 요청 흐름 추적
    - 성능 병목 지점 식별

  Application Performance Monitoring:
    - New Relic/Datadog 연동
    - 사용자 경험 메트릭
    - 에러 추적 및 분석
    - 성능 임계값 모니터링

  Log Management:
    - 구조화된 로그 포맷 (JSON)
    - 로그 집계 및 분석
    - 에러 패턴 인식
    - 보안 로그 분석

CI/CD Pipeline:
  - 자동화된 테스트
    * Unit Testing
    * Integration Testing
    * Performance Testing
    * Security Scanning

  - 배포 전략
    * Blue-Green Deployment
    * Canary Releases
    * Feature Flags
    * 자동 롤백

Backup & Disaster Recovery:
  - 자동화된 백업 (3-2-1 규칙)
  - 크로스 리전 복제
  - 재해 복구 테스트
  - RTO/RPO 목표 설정
```

### 5. 비용 최적화
```yaml
Resource Optimization:
  - 컨테이너 리소스 제한 설정
  - 스토리지 티어링 전략
  - 로그 보존 정책 최적화
  - 미사용 리소스 정리

Cloud Cost Management:
  - 리소스 태깅 전략
  - 비용 모니터링 대시보드
  - 자동 스케일 다운
  - Reserved Instance 활용

Monitoring Cost Optimization:
  - 메트릭 샘플링 최적화
  - 로그 레벨 조정
  - 알림 임계값 최적화
  - 스토리지 압축 활용
```

---

## 📈 시스템 메트릭 및 KPI

### 핵심 성능 지표
```yaml
Application Performance:
  - API 응답시간: P50/P95/P99
  - 에러율: <1% 목표
  - 처리량: TPS (Transactions Per Second)
  - 동시 연결 수

Audio Processing:
  - 분석 완료율: >99%
  - 평균 처리 시간: <30초
  - 큐 대기 시간: <5분
  - 배치 처리 처리량

Infrastructure Health:
  - CPU 사용률: <70% 평균
  - 메모리 사용률: <80% 평균
  - 디스크 I/O: IOPS 모니터링
  - 네트워크 대역폭

Business Metrics:
  - 일일 업로드 수
  - 사용자 활성도
  - 검색 정확도
  - 시스템 가용성: >99.9%
```

### 알림 정책 및 에스컬레이션
```yaml
Critical (즉시 알림):
  - 서비스 완전 중단
  - 데이터베이스 연결 실패
  - 디스크 용량 부족 (95%+)
  - 메모리 부족 (95%+)
  - SSL 인증서 만료 임박

Warning (5분 내):
  - 높은 응답시간 (>10초)
  - 에러율 증가 (>5%)
  - 큐 백로그 증가
  - 리소스 사용률 높음 (>80%)

Info (일일 요약):
  - 배포 완료 알림
  - 배치 작업 완료
  - 일일 통계 요약
  - 정기 점검 완료
```

---

*본 문서는 2025-09-26 기준으로 작성되었으며, 실제 docker-compose.yml 구성을 바탕으로 정리되었습니다.*