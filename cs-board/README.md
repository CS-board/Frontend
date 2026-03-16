# CHIP_SAT — 주간 백준 챌린지 플랫폼

> 국립금오공과대학교 컴퓨터공학부 **CHIP_SAT** 동아리의 주간 백준 문제풀이 챌린지 웹 서비스

백준 온라인 저지 풀이 기록을 자동으로 집계하고, 참여자 간 실시간 랭킹을 제공하는 플랫폼입니다.

---

## 📌 주요 기능

| 기능 | 설명 |
|---|---|
| **실시간 랭킹** | 챌린지별 참여자 순위 조회 및 정렬 (학과·점수·순위) |
| **내 기록** | 개인 풀이 이력, 일별 해결 문제, 챌린지별 진척도 조회 |
| **Q&A 게시판** | 알고리즘 문제 풀이 질문·답변, 좋아요·해결 표시 |
| **공지 게시판** | 운영진 공지사항 열람 |
| **회원가입** | 웹메일 인증 + 백준 ID 인증 기반 가입 |
| **비밀번호 재설정** | 웹메일 인증 코드를 통한 3단계 비밀번호 재설정 |
| **시즌제 챌린지** | Season 1, 2, … 형태의 챌린지 기간 운영 |

---

## 🛠 기술 스택

### Frontend
| 분류 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 (OKLCH 색상, CSS Variables) |
| Component | shadcn/ui + Radix UI |
| Form | React Hook Form + Zod |
| Font | Pretendard Variable (한국어 최적화) |
| Analytics | Vercel Analytics |

### Architecture
- **App Router** 기반 페이지 구조 (`app/` 디렉터리)
- **서비스 레이어** 분리 (`services/`) — API 호출 로직을 뷰와 독립적으로 관리
- **타입 중앙 관리** (`types/index.ts`) — 공통 응답 타입 및 도메인 타입 정의
- **API 클라이언트** (`api/client.ts`) — JWT 토큰 자동 첨부 및 에러 처리

---

## 📁 프로젝트 구조

```
cs-board/
├── app/                      # Next.js App Router 페이지
│   ├── page.tsx              # 홈 (desktop/mobile 분기 렌더링)
│   ├── ranking/              # 주간 랭킹
│   ├── my-record/            # 내 기록
│   ├── qna/                  # Q&A 게시판
│   ├── board/                # 공지 게시판
│   ├── login/                # 로그인
│   ├── signup/               # 회원가입
│   ├── forgot-password/      # 비밀번호 재설정
│   └── settings/             # 설정
│
├── components/
│   ├── features/             # 도메인 컴포넌트 (Sidebar, Footer, Home 등)
│   └── ui/                   # 공통 UI 컴포넌트 (shadcn/ui 기반)
│
├── services/                 # API 호출 서비스 레이어
│   ├── auth.ts               # 인증 (로그인·회원가입·비밀번호 재설정)
│   ├── challenge.ts          # 챌린지 정보·랭킹
│   ├── record.ts             # 개인 기록
│   ├── qna.ts                # Q&A
│   └── board.ts              # 게시판
│
├── api/
│   └── client.ts             # HTTP 클라이언트 (JWT, 에러 핸들링)
│
├── types/index.ts            # 공통 타입 정의
├── constants/index.ts        # API 엔드포인트, 라우트 상수
└── hooks/                    # 커스텀 훅 (use-auth, use-mobile 등)
```

---

## 🚀 시작하기

### 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd cs-board

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 에서 NEXT_PUBLIC_API_BASE_URL 설정

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 환경 변수

```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com/api
```

### 빌드

```bash
npm run build
npm run start
```

---

## 📐 디자인 시스템

- **색상**: OKLCH 기반 CSS Variables — 다크모드 대응
- **Primary**: 블루 계열 (`oklch(0.546 0.215 248)`)
- **Typography**: Pretendard Variable — 한국어 가독성 최적화, 모든 숫자·텍스트 통일
- **컴포넌트**: shadcn/ui 기반 커스터마이징 (Card, Button, Badge, Input, Select 등)
- **반응형**: 모바일/데스크탑 완전 분리 렌더링 (`useIsMobile` 훅)

---

## 🔐 인증 흐름

```
회원가입
  └─ 웹메일(@kumoh.ac.kr) 인증코드 확인
  └─ 백준 ID 유효성 검증
  └─ 계정 생성

로그인
  └─ JWT 토큰 발급 → localStorage 저장
  └─ API 요청 시 Authorization 헤더 자동 첨부

비밀번호 재설정
  └─ 이메일 입력 → 인증코드 발송 → 코드 확인 → 비밀번호 변경
```

---

## 📬 문의

- **이메일**: totoro7378@kumoh.ac.kr
- **소속**: 국립금오공과대학교 컴퓨터공학부 CHIP_SAT
