# 🎵 오락가락 (OrakGarak)

> **내 목소리에 딱 맞는 노래를 찾아보세요**  
> AI 기술을 활용한 맞춤형 음성 분석 및 노래 추천 플랫폼

## 📋 프로젝트 개요

오락가락은 사용자의 음성을 AI로 분석하여 음역대와 음색에 맞는 노래를 추천하고, 개인 앨범 제작 및 음악 커뮤니티 기능을 제공하는 웹 애플리케이션입니다.

### 🎯 주요 기능

- **🎤 음성 분석**: 실시간 음성 녹음 및 AI 분석
- **🎵 맞춤 추천**: 음역대/음색 기반 개인화된 노래 추천
- **💿 앨범 제작**: 녹음한 곡들로 나만의 앨범 생성
- **🎪 몰입 재생**: 3D 캐러셀을 활용한 몰입형 음악 재생 경험
- **👥 커뮤니티**: 다른 사용자와 앨범 공유 및 소통

## 🛠 기술 스택

### Frontend

- **React 18** + **TypeScript**
- **Material-UI (MUI)** - 기본 UI 컴포넌트
- **Tailwind CSS** - 커스텀 스타일링 및 애니메이션
- **React Router** - 라우팅
- **Zustand** - 상태 관리
- **React Hooks** - 커스텀 훅 (useAudio, useAuth 등)

### Backend (예정)

- **Node.js** + **Express**
- **MongoDB** - 데이터베이스
- **JWT** - 인증
- **Google OAuth** - 소셜 로그인

## 📁 프로젝트 구조

```
front/
├── src/
│   ├── components/           # 재사용 가능한 컴포넌트
│   │   ├── auth/            # 인증 관련 컴포넌트
│   │   │   └── AuthGuard.tsx # 라우트 보호 컴포넌트
│   │   ├── album/           # 앨범 관련 컴포넌트
│   │   │   └── ImmersivePlaybackModal.tsx # 3D 몰입 재생 모달
│   │   └── common/          # 공통 컴포넌트
│   │       ├── Header.tsx   # 메인 헤더
│   │       └── SimpleHeader.tsx # 간소화된 헤더
│   ├── hooks/               # 커스텀 훅
│   │   ├── useAuth.ts       # 인증 관련 훅
│   │   └── useAudio.ts      # 오디오 재생 훅
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── LandingPage.tsx  # 랜딩 페이지 (음악적 디자인)
│   │   ├── OnboardingRangePage.tsx # 음역대 분석 페이지 (게임형 UI)
│   │   ├── AlbumCreatePage.tsx # 앨범 제작 페이지
│   │   ├── AlbumDetailPage.tsx # 앨범 상세 페이지
│   │   ├── FeedPage.tsx     # 피드 페이지 (소셜 UI)
│   │   └── MyPage.tsx       # 마이페이지 (프로필 카드 디자인)
│   ├── services/            # API 서비스
│   │   ├── backend.ts       # 백엔드 API 호출
│   │   └── googleAuth.ts    # 구글 인증 서비스
│   ├── stores/              # 상태 관리
│   │   ├── authStore.ts     # 인증 상태
│   │   ├── albumStore.ts    # 앨범 상태
│   │   └── uiStore.ts       # UI 상태
│   ├── styles/              # 스타일 파일
│   │   └── immersive-playback.css # 3D 캐러셀 스타일
│   ├── types/               # 타입 정의
│   │   └── user.ts          # 사용자 관련 타입
│   └── data/                # 더미 데이터
│       ├── musicDatabase.ts # 음악 데이터베이스
│       └── recommendationData.ts # 추천 데이터
├── tailwind.config.js       # Tailwind 설정
└── package.json
```

## 🎨 디자인 시스템

### 색상 팔레트

- **Primary**: 보라색 계열 (`#9d00ff`, `#764ba2`)
- **Secondary**: 파란색 계열 (`#00e5ff`, `#667eea`)
- **Accent**: 핑크색 계열 (`#ff6b9d`, `#ff8a80`)
- **Background**: 다크/라이트 테마 지원

### UI 테마별 적용

- **🎮 게임형 UI**: 음역대 추천 페이지 (`OnboardingRangePage`)
- **🎨 앨범 제작 디자인**: 앨범 관련 페이지 (`AlbumCreatePage`)
- **👥 소셜 UI**: 피드 페이지 (`FeedPage`)
- **👤 프로필 카드 디자인**: 마이페이지 (`MyPage`)

## 🚀 주요 기능 상세

### 1. 🎤 몰입 재생 (Immersive Playback)

- **3D 캐러셀**: CSS Transform을 활용한 입체적 카드 배치
- **실시간 오디오**: Web Audio API 기반 음악 재생
- **인터랙티브 조작**: 드래그, 터치, 키보드 네비게이션
- **반응형 디자인**: 모바일/데스크톱 최적화

### 2. 🔐 인증 시스템

- **Google OAuth**: 구글 계정 연동 로그인
- **임시 로그인**: 개발용 더미 인증 기능
- **라우트 보호**: `AuthGuard` 컴포넌트로 인증된 사용자만 접근

### 3. 🎵 음악 관리

- **앨범 생성**: 트랙 추가/삭제/편집 기능
- **커버 아트**: AI 생성 앨범 커버 (예정)
- **재생 통계**: 점수, 좋아요, 재생 횟수 추적

## 🛠 개발 환경 설정

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

### 환경 변수

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_API_BASE_URL=http://localhost:3000/api
```

## 📱 반응형 디자인

- **Desktop**: 1200px+ (풀 기능 지원)
- **Tablet**: 768px - 1199px (터치 최적화)
- **Mobile**: 320px - 767px (모바일 우선 설계)

## 🎯 성능 최적화

- **메모이제이션**: `useMemo`, `useCallback` 활용
- **코드 스플리팅**: React.lazy를 통한 지연 로딩
- **이미지 최적화**: WebP 포맷 지원
- **번들 최적화**: Vite 기반 빠른 빌드

## 🔧 개발 도구

- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안정성
- **Vite**: 빠른 개발 서버 및 빌드

---

## 🧾 Git Commit Convention

### ✅ Commit Message 구조

```
<타입>: <간단한 설명>

본문 (선택)
```

### 📌 사용 가능한 타입(Type)

| 타입       | 설명                                              |
| ---------- | ------------------------------------------------- |
| `feat`     | 새로운 기능 추가                                  |
| `fix`      | 버그 수정                                         |
| `docs`     | 문서 수정 (README 등)                             |
| `style`    | 코드 포맷팅, 세미콜론 누락 등 기능 변화 없는 수정 |
| `refactor` | 코드 리팩토링 (기능 변화 없음)                    |
| `test`     | 테스트 코드 추가/수정                             |
| `chore`    | 빌드 업무, 패키지 매니저 설정 등 기타 변경        |
| `perf`     | 성능 개선                                         |
| `ci`       | CI 설정 수정                                      |
| `build`    | 빌드 관련 파일 수정                               |

### ✏️ 예시

```
feat: 몰입 재생 3D 캐러셀 기능 구현

Canvas 기반 음악 웨이브 애니메이션과 드래그/터치 네비게이션 추가
```

```
fix: 모바일 터치 이벤트 스크롤 충돌 해결

드래그 중 배경 스크롤 방지 및 자동 복원 로직 구현
```

```
perf: 앨범 트랙 카드 생성 로직 최적화

useState 대신 useMemo로 메모이제이션 적용하여 렌더링 성능 개선
```

### 📖 커밋 메시지 작성 규칙

1. 제목은 **50자 이내**로 작성, 첫 글자는 소문자.
2. 제목 끝에 `마침표(.)` 쓰지 않기.
3. **한글 또는 영어** 자유롭게 사용 가능 (팀 합의 기준).
4. 본문이 있다면, 제목과 본문 사이에 한 줄 공백 삽입.
5. 본문은 **무엇을, 왜** 변경했는지 설명.

---

## 🌿 Git 브랜치 전략

### 📌 브랜치 종류

| 브랜치 이름 | 용도                                   |
| ----------- | -------------------------------------- |
| `main`      | 실제 배포되는 운영 브랜치 (최종 제품)  |
| `develop`   | 통합 개발 브랜치 (모든 기능이 merge됨) |
| `feature/*` | 새로운 기능 개발용 브랜치              |
| `fix/*`     | 버그 수정용 브랜치                     |
| `hotfix/*`  | 운영 중 긴급 수정 브랜치               |
| `release/*` | 배포 준비 브랜치 (버전 태깅 등 포함)   |

### 🛠 브랜치 네이밍 규칙

- `feature/immersive-playback`
- `fix/mobile-touch-events`
- `hotfix/audio-playback-crash`
- `release/v1.0.0`

### 🔁 브랜치 사용 흐름

1. 기능 개발 시:  
   → `develop` 브랜치에서 `feature/기능명` 브랜치 생성 후 작업  
   → 완료되면 `develop`에 Pull Request로 merge

2. 버그 수정 시:  
   → `develop` 또는 `main` 기준으로 `fix/버그명` 브랜치 생성 후 수정  
   → 완료되면 `develop`에 merge (운영 이슈면 `main`에 바로 hotfix 가능)

3. 배포 준비 시:  
   → `develop` → `release/vX.X.X` 브랜치 생성  
   → 테스트 완료 후 `main`에 merge + 버전 태깅

4. 긴급 수정 시:  
   → `main`에서 `hotfix/이슈명` 브랜치 생성  
   → 수정 후 `main` + `develop`에 각각 merge

---

## 📞 팀 정보

**SSAFY 13기 C103팀**  
프로젝트 기간: 2024년

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
