# AI 데모 시스템 API 문서

## 📋 목차
1. [개요](#개요)
2. [인증 및 권한](#인증-및-권한)
3. [사용자 API](#사용자-api)
4. [관리자 API](#관리자-api)
5. [에러 코드](#에러-코드)
6. [데이터 모델](#데이터-모델)

---

## 📖 개요

AI 데모 시스템은 사용자가 녹음본을 기반으로 AI 커버 데모를 신청하고, 관리자가 이를 처리하여 AI 데모 파일을 제공하는 시스템입니다.

### 주요 기능
- **사용자**: AI 데모 신청, 내 신청 목록 조회, AI 데모 파일 재생
- **관리자**: 신청 관리(승인/거절), AI 데모 파일 업로드, 전체 관리

### Base URL
```
https://your-domain.com/api
```

---

## 🔐 인증 및 권한

### 인증 방식
- **Bearer Token** 방식 사용
- 모든 API 요청 시 Header에 토큰 포함 필요

```http
Authorization: Bearer <your-jwt-token>
```

### 권한 레벨
- **USER**: 일반 사용자 권한
- **ADMIN**: 관리자 권한

---

## 👤 사용자 API

### 1. AI 데모 신청

**POST** `/ai-demo/applications`

사용자가 본인의 녹음본으로 AI 데모를 신청합니다.

#### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
```

#### Request Body
```json
{
  "recordId": 123,
  "youtubeLinks": [
    "https://youtube.com/watch?v=example1",
    "https://youtube.com/watch?v=example2",
    "https://youtube.com/watch?v=example3"
  ]
}
```

#### Request Validation
- `recordId`: 필수, 본인 소유의 녹음본 ID
- `youtubeLinks`: 필수, 1-3개의 유효한 YouTube URL

#### Response (200 OK)
```json
{
  "id": 456,
  "userId": 789,
  "recordId": 123,
  "youtubeLinks": [
    "https://youtube.com/watch?v=example1",
    "https://youtube.com/watch?v=example2",
    "https://youtube.com/watch?v=example3"
  ],
  "status": "PENDING",
  "statusDescription": "대기 중",
  "adminNote": null,
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00",
  "processedAt": null,
  "record": {
    "id": 123,
    "title": "My Recording",
    "durationSeconds": 180,
    "url": "https://s3.../recordings/file.wav",
    "createdAt": "2024-01-10T15:20:00"
  }
}
```

#### Error Responses
```json
// 404 - 녹음본을 찾을 수 없음
{
  "code": 1500,
  "message": "녹음 파일을 찾을 수 없습니다."
}

// 409 - 중복 신청
{
  "code": 1902,
  "message": "이미 해당 녹음본으로 AI 데모 신청이 존재합니다."
}

// 400 - 권한 없음 (타인 녹음본)
{
  "code": 1901,
  "message": "본인 소유의 녹음본만 AI 데모 신청이 가능합니다."
}
```

---

### 2. 내 AI 데모 신청 목록 조회

**GET** `/ai-demo/applications/me`

현재 사용자의 모든 AI 데모 신청 내역을 조회합니다.

#### Request Headers
```http
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
[
  {
    "id": 456,
    "userId": 789,
    "recordId": 123,
    "youtubeLinks": ["https://youtube.com/watch?v=example1"],
    "status": "APPROVED",
    "statusDescription": "승인됨",
    "adminNote": "좋은 목소리네요! AI 데모 제작 진행합니다.",
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-16T09:15:00",
    "processedAt": "2024-01-16T09:15:00",
    "record": {
      "id": 123,
      "title": "My Recording",
      "durationSeconds": 180,
      "url": "https://s3.../recordings/file.wav"
    }
  }
]
```

---

### 3. 내 AI 데모 파일 조회

**GET** `/ai-demo/records/me`

현재 사용자에게 제공된 AI 데모 파일들을 조회합니다.

#### Request Headers
```http
Authorization: Bearer <token>
```

#### Response (200 OK)
```json
[
  {
    "id": 999,
    "userId": 789,
    "title": "AI Cover Demo - User789",
    "durationSeconds": 200,
    "url": "https://s3.../ai-cover/demo-file.wav",
    "urlStatus": "SUCCESS",
    "extension": "wav",
    "content_type": "audio/wav",
    "file_size": "5242880",
    "createdAt": "2024-01-20T14:30:00",
    "updatedAt": "2024-01-20T14:30:00",
    "uploadId": 1001
  }
]
```

---

### 4. 특정 AI 데모 신청 조회

**GET** `/ai-demo/applications/{applicationId}`

특정 신청의 상세 정보를 조회합니다.

#### Request Headers
```http
Authorization: Bearer <token>
```

#### Path Parameters
- `applicationId`: 신청 ID (Long)

#### Response (200 OK)
```json
{
  "id": 456,
  "userId": 789,
  "recordId": 123,
  "youtubeLinks": ["https://youtube.com/watch?v=example1"],
  "status": "COMPLETED",
  "statusDescription": "완료됨",
  "adminNote": "AI 데모 파일이 업로드되었습니다.",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-22T16:45:00",
  "processedAt": "2024-01-22T16:45:00",
  "record": {
    "id": 123,
    "title": "My Recording",
    "durationSeconds": 180
  }
}
```

---

## 👨‍💼 관리자 API

### 1. 상태별 신청 목록 조회

**GET** `/ai-demo/applications?status={status}`

관리자가 상태별로 AI 데모 신청들을 조회합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Query Parameters
- `status`: 신청 상태 (기본값: PENDING)
  - `PENDING`: 대기 중
  - `APPROVED`: 승인됨
  - `REJECTED`: 거절됨
  - `COMPLETED`: 완료됨

#### Response (200 OK)
```json
[
  {
    "id": 456,
    "userId": 789,
    "recordId": 123,
    "youtubeLinks": ["https://youtube.com/watch?v=example1"],
    "status": "PENDING",
    "statusDescription": "대기 중",
    "adminNote": null,
    "createdAt": "2024-01-15T10:30:00",
    "updatedAt": "2024-01-15T10:30:00",
    "processedAt": null,
    "record": {
      "id": 123,
      "userId": 789,
      "title": "User Recording",
      "durationSeconds": 180
    }
  }
]
```

---

### 2. AI 데모 신청 승인

**PUT** `/ai-demo/applications/{applicationId}/approve`

관리자가 AI 데모 신청을 승인합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Path Parameters
- `applicationId`: 신청 ID (Long)

#### Query Parameters
- `adminNote`: 관리자 메모 (선택사항)

#### Example Request
```http
PUT /ai-demo/applications/456/approve?adminNote=승인합니다. 3일 내 제작 예정
```

#### Response (200 OK)
```json
{
  "id": 456,
  "userId": 789,
  "recordId": 123,
  "status": "APPROVED",
  "statusDescription": "승인됨",
  "adminNote": "승인합니다. 3일 내 제작 예정",
  "processedAt": "2024-01-16T09:15:00",
  "updatedAt": "2024-01-16T09:15:00"
}
```

---

### 3. AI 데모 신청 거절

**PUT** `/ai-demo/applications/{applicationId}/reject`

관리자가 AI 데모 신청을 거절합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Path Parameters
- `applicationId`: 신청 ID (Long)

#### Query Parameters
- `adminNote`: 거절 사유 (선택사항)

#### Example Request
```http
PUT /ai-demo/applications/456/reject?adminNote=유튜브 링크에 저작권 문제가 있어 거절합니다.
```

#### Response (200 OK)
```json
{
  "id": 456,
  "status": "REJECTED",
  "statusDescription": "거절됨",
  "adminNote": "유튜브 링크에 저작권 문제가 있어 거절합니다.",
  "processedAt": "2024-01-16T11:20:00"
}
```

---

### 4. AI 데모 파일 업로드

**POST** `/ai-demo/records`

관리자가 특정 사용자에게 AI 데모 파일을 업로드합니다.

#### Request Headers
```http
Content-Type: multipart/form-data
Authorization: Bearer <admin-token>
```

#### Form Data
- `audioFile`: AI 데모 오디오 파일 (File, 필수)
- `title`: 파일 제목 (String, 필수)
- `targetUserId`: 대상 사용자 ID (Long, 필수)

#### Example Request
```bash
curl -X POST \
  -H "Authorization: Bearer <admin-token>" \
  -F "audioFile=@ai-demo.wav" \
  -F "title=AI Cover Demo - User789" \
  -F "targetUserId=789" \
  https://your-domain.com/api/ai-demo/records
```

#### Response (200 OK)
```json
{
  "id": 999,
  "userId": 789,
  "title": "AI Cover Demo - User789",
  "durationSeconds": 200,
  "url": "https://s3.../ai-cover/demo-file.wav",
  "urlStatus": "SUCCESS",
  "extension": "wav",
  "content_type": "audio/wav",
  "file_size": "5242880",
  "createdAt": "2024-01-20T14:30:00",
  "uploadId": 1001
}
```

---

### 5. AI 데모 신청 완료 처리

**PUT** `/ai-demo/applications/{applicationId}/complete`

AI 데모 파일 업로드 후 신청을 완료 상태로 변경합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Path Parameters
- `applicationId`: 신청 ID (Long)

#### Query Parameters
- `adminNote`: 완료 메모 (선택사항)

#### Example Request
```http
PUT /ai-demo/applications/456/complete?adminNote=AI 데모 파일 업로드 완료했습니다.
```

#### Response (200 OK)
```json
{
  "id": 456,
  "status": "COMPLETED",
  "statusDescription": "완료됨",
  "adminNote": "AI 데모 파일 업로드 완료했습니다.",
  "processedAt": "2024-01-22T16:45:00"
}
```

---

### 6. 전체 AI 데모 파일 조회

**GET** `/ai-demo/records`

관리자가 모든 AI 데모 파일들을 조회합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Response (200 OK)
```json
[
  {
    "id": 999,
    "userId": 789,
    "title": "AI Cover Demo - User789",
    "durationSeconds": 200,
    "url": "https://s3.../ai-cover/demo-file.wav",
    "createdAt": "2024-01-20T14:30:00"
  },
  {
    "id": 1000,
    "userId": 456,
    "title": "AI Cover Demo - User456",
    "durationSeconds": 185,
    "url": "https://s3.../ai-cover/demo-file2.wav",
    "createdAt": "2024-01-21T10:15:00"
  }
]
```

---

### 7. 특정 사용자 AI 데모 파일 조회

**GET** `/ai-demo/records/users/{userId}`

관리자가 특정 사용자의 AI 데모 파일들을 조회합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Path Parameters
- `userId`: 사용자 ID (Long)

#### Response (200 OK)
```json
[
  {
    "id": 999,
    "userId": 789,
    "title": "AI Cover Demo - User789",
    "durationSeconds": 200,
    "url": "https://s3.../ai-cover/demo-file.wav",
    "createdAt": "2024-01-20T14:30:00"
  }
]
```

---

### 8. 사용자별 상태별 신청 개수 조회

**GET** `/ai-demo/applications/users/{userId}/count?status={status}`

특정 사용자의 상태별 신청 개수를 조회합니다.

#### Request Headers
```http
Authorization: Bearer <admin-token>
```

#### Path Parameters
- `userId`: 사용자 ID (Long)

#### Query Parameters
- `status`: 신청 상태 (ApplicationStatus)

#### Response (200 OK)
```json
3
```

---

## ⚠️ 에러 코드

### AI 데모 관련 에러 코드 (1900-1999)

| 코드 | HTTP Status | 메시지 | 설명 |
|------|------------|--------|------|
| 1900 | 404 | AI 데모 신청을 찾을 수 없습니다. | 존재하지 않는 신청 ID |
| 1901 | 500 | AI 데모 신청 작업에 실패했습니다. | 서버 내부 오류 |
| 1902 | 409 | 이미 해당 녹음본으로 AI 데모 신청이 존재합니다. | 중복 신청 시도 |
| 1903 | 400 | 유효하지 않은 AI 데모 신청 상태입니다. | 잘못된 상태값 |

### 기존 에러 코드 참조

| 코드 | HTTP Status | 메시지 | 설명 |
|------|------------|--------|------|
| 1002 | 401 | 인증이 필요합니다. | 토큰 누락 또는 만료 |
| 1003 | 403 | 접근이 거부되었습니다. | 권한 부족 |
| 1500 | 404 | 녹음 파일을 찾을 수 없습니다. | 존재하지 않는 녹음본 |
| 1501 | 403 | 녹음 파일에 대한 권한이 없습니다. | 타인 녹음본 접근 |

---

## 📊 데이터 모델

### ApplicationStatus (열거형)
```
PENDING: 대기 중
APPROVED: 승인됨
REJECTED: 거절됨
COMPLETED: 완료됨
```

### AiDemoApplicationRequestDTO
```json
{
  "recordId": "Long (필수)",
  "youtubeLinks": "List<String> (필수, 1-3개, YouTube URL 형식)"
}
```

### AiDemoApplicationResponseDTO
```json
{
  "id": "Long",
  "userId": "Long",
  "recordId": "Long",
  "youtubeLinks": "List<String>",
  "status": "ApplicationStatus",
  "statusDescription": "String",
  "adminNote": "String",
  "createdAt": "LocalDateTime",
  "updatedAt": "LocalDateTime",
  "processedAt": "LocalDateTime",
  "record": "RecordResponseDTO"
}
```

### RecordResponseDTO
```json
{
  "id": "Long",
  "userId": "Long",
  "songId": "Long",
  "title": "String",
  "durationSeconds": "Integer",
  "extension": "String",
  "content_type": "String",
  "file_size": "String",
  "url": "String",
  "urlStatus": "String",
  "createdAt": "LocalDateTime",
  "updatedAt": "LocalDateTime",
  "uploadId": "Long"
}
```

---

## 🔄 전체 플로우

### 사용자 플로우
1. **녹음본 업로드** (기존 시스템)
2. **총 재생시간 30분 검증** (프론트엔드)
3. **AI 데모 신청**: `POST /ai-demo/applications`
4. **신청 상태 확인**: `GET /ai-demo/applications/me`
5. **AI 데모 파일 재생**: `GET /ai-demo/records/me`

### 관리자 플로우
1. **신청 목록 조회**: `GET /ai-demo/applications?status=PENDING`
2. **신청 승인**: `PUT /ai-demo/applications/{id}/approve`
3. **AI 데모 파일 업로드**: `POST /ai-demo/records`
4. **신청 완료 처리**: `PUT /ai-demo/applications/{id}/complete`

---

## 📝 참고사항

### 파일 업로드 제한
- **지원 형식**: WAV, MP3, M4A, FLAC, AAC, OGG
- **최대 크기**: 서버 설정에 따름
- **자동 변환**: 모든 오디오 파일은 WAV로 변환되어 저장

### 보안 고려사항
- 모든 API는 JWT 토큰 인증 필요
- 관리자 API는 ADMIN 역할 필요
- 파일 접근은 Pre-signed URL 사용
- 사용자는 본인 데이터만 접근 가능

### 성능 최적화
- JOIN FETCH로 N+1 쿼리 방지
- directory 기반 인덱싱으로 빠른 조회
- S3 Pre-signed URL로 직접 파일 접근

---

*📅 작성일: 2024년 1월*
*🔄 최종 업데이트: 2024년 1월*