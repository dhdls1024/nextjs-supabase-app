# Phase 3: 핵심 기능 구현 계획

## Context

Phase 1(라우트/타입/DB 스키마)과 Phase 2(더미 데이터 기반 UI)가 완료된 상태.
Phase 3에서는 더미 데이터를 실제 Supabase 연동으로 교체하고 핵심 비즈니스 로직을 구현한다.

---

## 공통 설계 원칙

### ActionResult 패턴 (모든 Server Action 공통)
```typescript
// app/actions/types.ts (신규)
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
```

### Client Component에서 Server Action 호출 패턴
```typescript
const [isPending, startTransition] = useTransition()

const onSubmit = (data: FormData) => {
  startTransition(async () => {
    const result = await serverAction(data)
    if (result.success) {
      toast.success("성공 메시지")
      router.push("/destination")
    } else {
      toast.error(result.error)
    }
  })
}
```

### 페이지 갱신 전략
- Server Component 데이터: `revalidatePath()`
- 영수증 목록 업로드 후: `router.refresh()`
- Realtime 데이터: `useState` + Realtime 이벤트 직접 갱신

---

## Task 012: Supabase DB 구축 및 RLS 설정

**작업 방식:** 코드 없이 Supabase MCP 도구만 사용

### 실행 단계
1. `mcp__supabase__apply_migration` — `supabase/migrations/001_create_subtracker_schema.sql` 적용
2. `mcp__supabase__execute_sql` — Storage 버킷 및 RLS 정책 생성
3. `mcp__supabase__generate_typescript_types` — `lib/types/database.ts` 자동 업데이트

### Storage 버킷 생성 SQL
```sql
-- logos 버킷 (공개)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT DO NOTHING;
-- receipts 버킷 (비공개)
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT DO NOTHING;

-- Storage RLS 정책
CREATE POLICY "logos_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "receipts_select" ON storage.objects FOR SELECT USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_delete" ON storage.objects FOR DELETE USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 변경 파일
- `lib/types/database.ts` — MCP 자동 생성으로 교체

---

## Task 013: 구독 CRUD + 대시보드 연동

**의존성:** Task 012

### 신규 파일
- `app/actions/types.ts` — ActionResult 타입 정의
- `app/actions/subscription.ts` — Server Actions

### subscription.ts 함수 목록
| 함수 | 반환 타입 | 용도 |
|------|-----------|------|
| `getSubscriptions()` | `Subscription[]` | Server Component 직접 호출 |
| `getSubscription(id)` | `Subscription \| null` | 상세 페이지 |
| `createSubscription(data)` | `ActionResult<Subscription>` | 폼 제출 |
| `updateSubscription(id, data)` | `ActionResult<Subscription>` | 수정 폼 |
| `deleteSubscription(id)` | `ActionResult` | 삭제 다이얼로그 |

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `app/(app)/dashboard/page.tsx` | `DUMMY_SUBSCRIPTIONS` → `getSubscriptions()`, async 함수로 변경 |
| `app/(app)/subscriptions/[id]/page.tsx` | `getDummySubscription` → `getSubscription(id)` |
| `app/(app)/analytics/page.tsx` | `DUMMY_SUBSCRIPTIONS` → `getSubscriptions()`, async 함수로 변경 |
| `components/subscription-form.tsx` | `onSubmit` → `createSubscription()` + `useTransition` + `toast` |
| `components/subscription-edit-form.tsx` | `onSubmit` → `updateSubscription()` + `useTransition` + `toast` |
| `components/delete-subscription-dialog.tsx` | `handleDelete` → `deleteSubscription()` + `toast` + `router.push("/dashboard")` |

---

## Task 014: Supabase Storage 연동

**의존성:** Task 012, Task 013

### 신규 파일
- `app/actions/storage.ts` — Storage Server Actions

### storage.ts 함수 목록
| 함수 | 용도 |
|------|------|
| `uploadReceipt(formData, subscriptionId)` | receipts 버킷 업로드 + DB INSERT. 실패 시 Storage 롤백 |
| `getReceipts(subscriptionId)` | 영수증 목록 조회 |
| `getSignedUrl(filePath)` | 비공개 파일 임시 접근 URL (60초) |
| `deleteReceipt(receiptId, filePath)` | Storage 파일 + DB 레코드 동시 삭제 |
| `uploadLogo(formData, subscriptionId)` | logos 버킷 업로드 → 공개 URL 반환 |

**파일 경로 규칙:** `{userId}/{subscriptionId}/{timestamp}_{fileName}` (Storage RLS와 일치)

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `components/receipt-section.tsx` | Props에 `initialReceipts: Receipt[]` 추가, 파일 업로드 → `uploadReceipt()` + `router.refresh()`, 미리보기/다운로드 → `getSignedUrl()` |
| `app/(app)/subscriptions/[id]/page.tsx` | `getReceipts(id)` 조회 후 `initialReceipts` prop으로 전달 |

---

## Task 015: 공유 그룹 생성 및 멤버 관리

**의존성:** Task 012, Task 013

### 신규 파일
- `app/actions/group.ts` — Group Server Actions
- `app/(app)/groups/join/page.tsx` — 초대 링크 처리 페이지 (Server Component)

### group.ts 함수 목록
| 함수 | 용도 |
|------|------|
| `createGroup(data)` | groups INSERT + OWNER를 group_members에 자동 등록 |
| `getGroups()` | 자신이 속한 그룹 목록 (memberCount, subscriptionCount 포함) |
| `getGroup(id)` | 그룹 상세 (멤버, 공유 구독 포함) |
| `joinGroup(inviteCode)` | invite_code 검증 → group_members INSERT |
| `linkSubscriptionToGroup(groupId, subscriptionId, splitAmount)` | group_subscriptions INSERT |

**invite_code 생성:** `Math.random().toString(36).substring(2,10).toUpperCase()` (8자리)

### join/page.tsx 처리 흐름
```
searchParams.code → joinGroup(code) → 성공: redirect(`/groups/${id}`) / 실패: redirect("/groups?error=invalid_code")
```

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `app/(app)/groups/page.tsx` | `"use client"` 제거 → Server Component, `DUMMY_GROUPS` → `getGroups()` |
| `app/(app)/groups/[id]/page.tsx` | `getDummyGroup` → `getGroup(id)` |
| `components/create-group-modal.tsx` | `onSubmit` → `createGroup()` + `useTransition` + `toast` |
| `components/join-group-form.tsx` | `handleJoin` → `joinGroup()` + `toast` + `router.push` |

---

## Task 016: Realtime 결제 상태 동기화

**의존성:** Task 012, Task 015

### 신규 파일
- `app/actions/payment.ts` — `updatePaymentStatus(groupSubscriptionId, status, groupId)`
- `components/payment-status-realtime.tsx` — Realtime 구독 Client Component

### Realtime 패턴
```typescript
useEffect(() => {
  const supabase = createClient()  // 브라우저 클라이언트
  const channel = supabase
    .channel(`group_subscriptions:${groupId}`)
    .on("postgres_changes", { event: "UPDATE", table: "group_subscriptions", filter: `group_id=eq.${groupId}` },
      (payload) => setGroupSubs(prev => prev.map(gs => gs.id === payload.new.id ? payload.new : gs))
    )
    .subscribe((status) => { /* 연결 상태 업데이트 */ })

  return () => { supabase.removeChannel(channel) }  // 언마운트 시 해제
}, [groupId])
```

### 수정 파일
- `app/(app)/groups/[id]/page.tsx` — 공유 구독 테이블 → `PaymentStatusRealtime` 컴포넌트 교체

---

## Task 017: 지출 분석 View 연동

**의존성:** Task 012, Task 013

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `app/(app)/analytics/page.tsx` | `category_monthly_stats`, `monthly_trend_stats` View 직접 쿼리, `AnalyticsCharts`에 `monthlyTrend` prop 추가 |
| `components/analytics-charts.tsx` | `monthlyTrend` prop 추가, `MonthlyTrendLineChart` 컴포넌트 추가 (recharts `LineChart`), 빈 상태 UI 처리 |

---

## Task 018: 이메일 알림 Edge Function

**의존성:** Task 012, Task 013

### 신규 파일
- `supabase/functions/notify-upcoming-payments/index.ts` — Deno Edge Function

### 실행 단계
1. Edge Function 작성 (Deno + Resend SDK via esm.sh)
2. `mcp__supabase__deploy_edge_function`으로 배포
3. `mcp__supabase__execute_sql`로 pg_cron 스케줄 등록 (매일 UTC 0시 = KST 9시)

```sql
SELECT cron.schedule(
  'notify-upcoming-payments', '0 0 * * *',
  $$ SELECT net.http_post(url := '{SUPABASE_URL}/functions/v1/notify-upcoming-payments', headers := '{"Authorization": "Bearer {ANON_KEY}"}'::jsonb) $$
);
```

---

## Task 019: 통합 E2E 테스트

**의존성:** Task 013~018 모두 완료 후

Playwright MCP로 전체 사용자 플로우 테스트:
1. 로그인 → 대시보드 접근
2. 구독 추가 → 목록 반영
3. 구독 수정/삭제 확인
4. 영수증 업로드/다운로드
5. 그룹 생성 → 초대 코드 발급
6. 초대 코드로 그룹 참여
7. 결제 상태 변경 → Realtime 반영 (두 탭)
8. 분석 페이지 차트 렌더링

---

## 태스크 실행 순서

```
Task 012 (DB 구축)
    ↓
Task 013 (구독 CRUD) ← 핵심, 가장 먼저
    ↓         ↘
Task 014    Task 015 (그룹)
(Storage)       ↓
            Task 016 (Realtime)

Task 017 (분석) ← 013 완료 후 독립 진행
Task 018 (알림) ← 012, 013 후 독립 진행
Task 019 (테스트) ← 모든 태스크 완료 후
```

## 검증 방법
각 태스크 완료 후:
```bash
npm run check-all  # ESLint + TypeScript + Prettier
npm run build      # 빌드 성공 확인
```
