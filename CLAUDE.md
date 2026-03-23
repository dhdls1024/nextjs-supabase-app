# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 개발 명령어

```bash
npm run dev      # 개발 서버 실행 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

shadcn/ui 컴포넌트 추가:
```bash
npx shadcn@latest add [component-name]
```

## 아키텍처 개요

**Next.js 15 App Router + Supabase** 기반 풀스택 앱.

### 라우트 구조

- `/` — 공개 랜딩 페이지 (`app/page.tsx`)
- `/auth/*` — 인증 흐름 (`login`, `sign-up`, `forgot-password`, `update-password`, `confirm`, `error`)
- `/protected/*` — 인증 필요 페이지 (`app/protected/`)

### 인증 흐름

`proxy.ts` → `lib/supabase/proxy.ts`의 `updateSession`이 미들웨어 역할. 인증되지 않은 사용자가 `/`, `/login`, `/auth/*` 외 경로 접근 시 `/auth/login`으로 리다이렉트.

Supabase 클라이언트:
- **브라우저**: `lib/supabase/client.ts` (`createBrowserClient`)
- **서버**: `lib/supabase/server.ts` (`createServerClient`) — Server Component, Route Handler에서 사용
- **미들웨어**: `lib/supabase/proxy.ts` (`updateSession`)

이메일 OTP 확인은 `app/auth/confirm/route.ts`에서 처리.

### 컴포넌트 구조

- `components/ui/` — shadcn/ui 기반 기본 UI 컴포넌트 (비즈니스 로직 없음)
- `components/` 루트 — 인증 폼 등 기능 컴포넌트
- `components/tutorial/` — 스타터킷 튜토리얼 컴포넌트 (필요시 삭제 가능)

### 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

`lib/utils.ts`의 `hasEnvVars`로 환경 변수 설정 여부 확인. 미설정 시 `EnvVarWarning` 컴포넌트 표시.

## 핵심 개발 규칙

### Next.js 15 필수 사항

- **App Router만 사용** — Pages Router 금지
- **Server Components 우선** — `'use client'`는 상태/이벤트가 필요한 경우만
- **async params** — `params`, `searchParams`는 반드시 `await`로 처리

```typescript
// ✅ 올바른 방법
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

### 경로 별칭

상대 경로 대신 `@/` 별칭 사용:
```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

### 타입

`lib/types/database.ts` — Supabase 데이터베이스 타입 정의 위치
