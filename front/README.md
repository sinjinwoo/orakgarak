# AI 노래방 서비스 - Frontend

React + TypeScript + Vite 기반의 AI 노래방 서비스 프론트엔드입니다.

## 기술 스택

- **언어**: TypeScript
- **프레임워크**: React (Vite 기반)
- **상태 관리**:
  - Zustand → UI 로컬 상태
  - TanStack Query → 서버 상태
- **라우팅**: React Router (v6+, lazy loading 적용)
- **UI**: MUI + Tailwind CSS (+ Radix UI 일부)
- **HTTP 클라이언트**: Axios

## 프로젝트 구조

```
src/
├── app/                        # 앱 설정
│   ├── AppProviders.tsx        # Provider 래핑
│   ├── router.tsx              # 라우팅 정의
│   ├── theme.ts                # MUI + Tailwind 커스텀 테마
│   ├── index.css               # 전역 스타일
│   └── ErrorBoundary.tsx       # 전역 에러 캐치
│
├── pages/                      # 페이지 컴포넌트
│   ├── LandingPage.tsx         # 랜딩
│   ├── OnboardingSurveyPage.tsx
│   ├── OnboardingRangePage.tsx
│   ├── RecommendationsPage.tsx
│   ├── RecordPage.tsx
│   ├── AlbumCreatePage.tsx
│   ├── AlbumDetailPage.tsx
│   ├── FeedPage.tsx
│   ├── MyPage.tsx
│   └── NotFoundPage.tsx
│
├── components/                 # 재사용 가능한 컴포넌트
│   ├── common/                 # 공통 컴포넌트
│   ├── onboarding/             # 온보딩 관련
│   ├── recommendation/         # 추천 관련
│   ├── record/                 # 녹음 관련
│   ├── album/                  # 앨범 관련
│   ├── feed/                   # 피드 관련
│   └── profile/                # 프로필 관련
│
├── stores/                     # Zustand 스토어
│   ├── authStore.ts            # 인증 상태
│   ├── onboardingStore.ts      # 온보딩 데이터
│   ├── recordStore.ts          # 녹음 상태
│   ├── albumStore.ts           # 앨범 데이터
│   └── uiStore.ts              # UI 상태 (모달, 토스트 등)
│
├── hooks/                      # 커스텀 훅
├── utils/                      # 유틸리티 함수
├── services/                   # API 서비스
├── types/                      # TypeScript 타입 정의
└── main.tsx                    # 엔트리포인트
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.example` 파일을 참고하여 `.env` 파일을 생성하고 필요한 환경 변수를 설정하세요.

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 주요 기능

- **온보딩**: 사용자 선호도 설문 및 음역대 측정
- **추천**: AI 기반 맞춤형 노래 추천
- **녹음**: 노래방 모드 녹음 및 실시간 피드백
- **앨범**: 녹음 모음집 제작 및 공유
- **피드**: 소셜 기능 (팔로우, 좋아요, 댓글)
- **마이페이지**: 개인 통계 및 관리

## 라우팅

- `/` - 랜딩 페이지
- `/onboarding/survey` - 온보딩 설문
- `/onboarding/range` - 음역대 측정
- `/recommendations` - 추천 곡
- `/record` - 녹음
- `/albums/create` - 앨범 생성
- `/albums/:albumId` - 앨범 상세
- `/feed` - 피드
- `/me` - 마이페이지
- `/*` - 404 페이지

## 개발 가이드

### 컴포넌트 작성 규칙

1. TypeScript를 사용하여 타입 안정성 확보
2. MUI 컴포넌트를 기본으로 사용하고 Tailwind로 스타일링
3. 재사용 가능한 컴포넌트는 `components/common`에 배치
4. 페이지별 특화 컴포넌트는 해당 페이지 폴더에 배치

### 상태 관리

- **Zustand**: 클라이언트 상태 (UI 상태, 사용자 데이터 등)
- **TanStack Query**: 서버 상태 (API 데이터 캐싱, 동기화 등)

### API 통신

- `services/apiClient.ts`에서 Axios 인스턴스 설정
- 각 도메인별로 API 함수들을 `services/` 폴더에 분리
- TanStack Query와 함께 사용하여 캐싱 및 동기화 처리
