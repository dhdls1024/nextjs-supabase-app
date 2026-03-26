# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 자주 사용하는 명령어

```bash
npm run dev         # 개발 서버 (Turbopack)
npm run build       # 프로덕션 빌드
npm run check-all   # TypeScript + ESLint + Prettier 일괄 검사 (커밋 전 필수)

npx shadcn@latest add <component>  # shadcn/ui 컴포넌트 추가
```

## 아키텍처 개요

**Next.js 15 App Router + Supabase** 기반 구독 관리 앱 (SubTracker).

### 라우트 구조

```
app/
├── page.tsx                     # 공개 랜딩 페이지
├── auth/*                       # 인증 흐름 (login, sign-up, confirm 등)
└── (app)/                       # Route Group — 인증 필요 영역
    ├── layout.tsx               # AppHeader(PC) + MobileHeader + MobileTabBar
    ├── dashboard/page.tsx       # 구독 요약, 카테고리 필터
    ├── subscriptions/new/       # 구독 추가 폼
    ├── subscriptions/[id]/      # 구독 상세 + 영수증
    ├── groups/page.tsx          # 공유 그룹 목록
    ├── groups/[id]/page.tsx     # 그룹 상세 + 정산 + Realtime
    ├── analytics/page.tsx       # 카테고리별 지출 차트
    └── more/page.tsx            # 닉네임 설정, 알림 설정
```

### 인증 흐름

`proxy.ts` → `lib/supabase/proxy.ts`의 `updateSession`이 미들웨어 역할.
`/auth/*` 외 경로는 인증되지 않은 사용자를 `/auth/login`으로 리다이렉트.

Supabase 클라이언트:

- **서버** (`lib/supabase/server.ts`): Server Component, Server Action, Route Handler에서 사용
- **브라우저** (`lib/supabase/client.ts`): `'use client'` 컴포넌트에서 사용 (Realtime 구독 포함)

### Server Actions 패턴

모든 데이터 변경은 `app/actions/` 하위 Server Actions로 처리.

```typescript
"use server"

export async function createSubscription(input): Promise<ActionResult<Subscription>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase.from("subscriptions").insert(...).select().single()
  if (error || !data) return { success: false, error: error?.message ?? "실패" }

  revalidatePath("/dashboard")
  return { success: true, data }
}
```

**공통 반환 타입** (`app/actions/types.ts`):

```typescript
type ActionResult<T = void> = { success: true; data: T } | { success: false; error: string }
```

### 페이지 렌더링 패턴

데이터 조회는 Suspense 경계 안의 내부 `async function Content()` 컴포넌트에서 처리.
외부 `Page()` 컴포넌트는 레이아웃과 Suspense fallback만 담당.

```typescript
export default function GroupsPage() {
  return (
    <Suspense fallback={<div>불러오는 중...</div>}>
      <GroupsContent />   {/* 여기서 await Server Action 호출 */}
    </Suspense>
  )
}
```

### 성능 최적화 규칙

1. **waterfall 금지** — 여러 독립 쿼리는 `Promise.all`로 병렬 실행
2. **N+1 금지** — 리스트 렌더링 시 개별 컴포넌트에서 쿼리하지 말고 상위에서 일괄 조회 후 filter로 전달
3. **getUser() 중복 제거** — 페이지에서 1회 호출 후 `userId`를 인자로 받는 Action 사용 (`getSubscriptionsByUserId(userId)` 등)

```typescript
// ✅ 올바른 방법
const [groups, allGroupSubs] = await Promise.all([getGroups(), getAllGroupSubscriptionsForUser()])

// ❌ Waterfall
const groups = await getGroups()
const subs = await getAllGroupSubscriptionsForUser()
```

### 데이터베이스 스키마 요약

| 테이블                | 주요 컬럼                                                                              |
| --------------------- | -------------------------------------------------------------------------------------- |
| `subscriptions`       | user_id, name, category, amount, billing_cycle, next_billing_date, status              |
| `groups`              | owner_id, name, invite_code                                                            |
| `group_members`       | group_id, user_id, role (OWNER\|MEMBER)                                                |
| `group_subscriptions` | group_id, subscription_id, member_split_amounts(JSONB), member_payment_statuses(JSONB) |
| `receipts`            | subscription_id, file_url, file_name                                                   |
| `profiles`            | id(=auth.user_id), nickname, email                                                     |

- `group_subscriptions`, `receipts`는 부모 삭제 시 **CASCADE** 자동 삭제
- `member_split_amounts`, `member_payment_statuses`는 `Record<userId, value>` 형태의 JSONB
- 멤버 퇴출 시 JSONB 키 정리는 RPC `remove_member_from_group_subs` 사용
- 구독/그룹 삭제 시 Storage 파일 정리는 코드에서 명시적으로 처리 (CASCADE 미적용)

### 컴포넌트 구조

- `components/ui/` — shadcn/ui 기본 컴포넌트 (비즈니스 로직 없음)
- `components/` 루트 — 기능 컴포넌트 (Server Action 호출, Realtime 구독 등)
- 클라이언트 컴포넌트는 상태/이벤트/Realtime이 필요한 경우만 `'use client'` 사용

### Realtime 동기화

그룹 상세 페이지는 `GroupRealtimeSync` 컴포넌트가 세 채널을 구독:

1. `group_subscriptions` — 결제 상태 변경 (`PaymentStatusRealtime`)
2. `group_members` — 멤버 추가/퇴출
3. `receipts` — 영수증 업로드/삭제

변경 감지 시 `router.refresh()`로 Server Component 데이터를 재조회.

### 환경 변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

### 타입 정의

- `lib/types/database.ts` — Supabase 테이블/View 타입
- `lib/types/index.ts` — `CATEGORIES`, `BILLING_CYCLES` 등 UI 공통 상수
- `lib/validations/` — Zod 스키마 (구독/그룹 폼 검증)

### Next.js 15 필수 사항

- **App Router만 사용** — Pages Router 금지
- **async params** — `params`, `searchParams`는 반드시 `await`로 처리

```typescript
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
```

- 경로 별칭은 `@/` 사용 (상대 경로 금지)

## 개발 가이드 문서

- **로드맵**: `docs/ROADMAP.md`
- **요구사항**: `docs/PRD.md`
