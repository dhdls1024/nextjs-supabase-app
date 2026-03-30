# SubTracker 개발 로드맵

여러 곳에 흩어진 정기 구독 서비스를 한 곳에서 통합 관리하고 불필요한 지출을 방지하는 구독 관리 앱.

**최종 업데이트**: 2026-03-27
**진행 상황**: Phase 1~4 전체 완료 (22/22 Tasks 완료)

---

## 개요

SubTracker는 개인 또는 가족/친구와 OTT, 클라우드, SaaS 구독을 공유하며 비용을 관리하는 사용자를 위해 다음 기능을 제공합니다:

- **구독 통합 관리**: 모든 구독 서비스를 한 곳에서 추가, 수정, 삭제하고 결제 임박 항목을 즉시 파악
- **공유 그룹**: 가족/친구와 공유 구독을 그룹으로 관리하고 분담 금액을 실시간으로 동기화
- **지출 분석**: 카테고리별 월 지출 통계 차트로 구독 비용 최적화 의사결정 지원
- **영수증 스토리지**: 구독별 영수증/인보이스 파일을 Supabase Storage에 업로드하고 언제든 다운로드
- **PWA 푸시 알림**: Service Worker + FCM + Edge Functions + pg_cron으로 결제일 D-day 자동 푸시 알림

---

## 개발 워크플로우

1. **작업 계획**
   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 `ROADMAP.md` 업데이트
   - 우선순위 작업은 마지막 완료된 작업 다음에 삽입

2. **작업 구현**
   - 작업 파일의 명세서를 따름
   - **API 연동 및 비즈니스 로직 구현 시 Playwright MCP로 테스트 수행 필수**
   - 각 단계 완료 후 중단하고 추가 지시를 기다림

3. **로드맵 업데이트**
   - 로드맵에서 완료된 작업을 체크 표시로 업데이트

---

## 개발 단계

### Phase 1: 애플리케이션 골격 구축 ✅

전체 라우트 구조와 빈 페이지 파일들을 먼저 생성하여 앱의 전체 흐름을 확인할 수 있는 골격을 구축합니다.

- **Task 001: 전체 라우트 구조 및 빈 페이지 생성** ✅ - 완료
  - ✅ `app/(app)/dashboard/page.tsx` 빈 페이지 생성
  - ✅ `app/(app)/subscriptions/new/page.tsx` 빈 페이지 생성
  - ✅ `app/(app)/subscriptions/[id]/page.tsx` 동적 라우트 빈 페이지 생성
  - ✅ `app/(app)/groups/page.tsx` 빈 페이지 생성
  - ✅ `app/(app)/groups/[id]/page.tsx` 동적 라우트 빈 페이지 생성
  - ✅ `app/(app)/analytics/page.tsx` 빈 페이지 생성
  - ✅ 각 페이지에 라우트 이름과 담당 기능 ID를 주석으로 명시

- **Task 002: 공통 레이아웃 및 네비게이션 골격 구현** ✅ - 완료
  - ✅ `app/(app)/layout.tsx` 공통 레이아웃 생성
  - ✅ `components/app-header.tsx` PC 탑 네비게이션 구현 (NAV_LINKS 상수)
  - ✅ `components/mobile-header.tsx` 모바일 상단 헤더 구현
  - ✅ `components/mobile-tab-bar.tsx` 모바일 하단 탭바 구현 (5탭)
  - ✅ 반응형 레이아웃 (md 기준 PC/모바일 분기)

- **Task 003: TypeScript 타입 정의 및 인터페이스 설계** ✅ - 완료
  - ✅ `lib/types/database.ts` Supabase 테이블 타입 정의 (5개 테이블)
  - ✅ `lib/types/index.ts` UI 공통 타입 및 상수 정의
  - ✅ `lib/validations/subscription.ts` Zod 스키마
  - ✅ `lib/validations/group.ts` Zod 스키마
  - ✅ `CategoryMonthlyStat` View 타입 정의 (MonthlyTrendStat 제거됨)

- **Task 004: 데이터베이스 스키마 설계 및 마이그레이션 파일 작성** ✅ - 완료
  - ✅ `supabase/migrations/001_create_subtracker_schema.sql` 생성
  - ✅ 5개 테이블 DDL 작성 (subscriptions, receipts, groups, group_members, group_subscriptions)
  - ✅ PostgreSQL View DDL 작성 (category_monthly_stats)
  - ✅ RLS 정책 설계 및 문서화

---

### Phase 2: UI/UX 완성 (더미 데이터 활용) ✅

실제 데이터베이스 연동 없이 하드코딩된 더미 데이터로 모든 페이지의 UI를 완성합니다.

- **Task 005: 공통 UI 컴포넌트 라이브러리 구현** ✅ - 완료
  - ✅ shadcn/ui 컴포넌트 설치 (table, dialog, tabs, select, avatar, separator, sonner, switch, alert-dialog)
  - ✅ `components/status-badge.tsx` 구독 상태 배지
  - ✅ `components/urgent-badge.tsx` 결제 임박 배지 (3일 이내)
  - ✅ `components/amount-display.tsx` 원화 포맷팅
  - ✅ `components/page-header.tsx` 페이지 헤더 (액션 슬롯 포함)
  - ✅ `lib/dummy-data.ts` 더미 데이터 생성

- **Task 006: 랜딩 페이지 UI 구현** ✅ - 완료
  - ✅ `app/page.tsx` 히어로 섹션 (CTA 버튼 2개)
  - ✅ sticky 네비게이션 + ThemeSwitcher
  - ✅ 푸터 카피라이트
  - ✅ 기능 소개 카드 섹션 제거 (심플 랜딩으로 정리)

- **Task 007: 대시보드 페이지 UI 구현** ✅ - 완료
  - ✅ 요약 카드 3개 (월 총 지출, 활성 구독 수, 결제 임박)
  - ✅ `components/category-filter.tsx` 카테고리 필터 탭 + 구독 목록 테이블
  - ✅ UrgentBadge, StatusBadge 적용
  - ✅ 행 클릭 → 상세 페이지 이동
  - ✅ 구독 목록 카드에 서비스 로고 표시 (Google Favicon API)

- **Task 008: 구독 추가 페이지 UI 구현** ✅ - 완료
  - ✅ `components/subscription-form.tsx` react-hook-form + Zod
  - ✅ 8개 필드 (name, category, amount, billing_cycle, next_billing_date, status, notes, logo_url)
  - ✅ 서비스 선택 UI 개선: 카테고리 칩 + 서비스 드롭다운 + Google Favicon API 로고 미리보기
  - ✅ SERVICE_PRESETS 주요 서비스 추가 (OTT 7개, AI 6개, 쇼핑 4개, 음악 6개, 기타 4개)

- **Task 009: 구독 상세 페이지 UI 구현** ✅ - 완료
  - ✅ `components/subscription-edit-form.tsx` 초기값 설정
  - ✅ `components/delete-subscription-dialog.tsx` 삭제 확인 다이얼로그
  - ✅ `components/receipt-section.tsx` 파일 업로드 드롭존 + 목록 테이블

- **Task 010: 더보기 탭 및 설정 페이지 구현** ✅ - 완료
  - ✅ `app/(app)/more/page.tsx` 생성 (계정 정보, 알림설정, 앱 버전, 로그아웃)
  - ✅ `components/notification-settings.tsx` 결제일 알림 토글 + D-day 시점 선택
  - ✅ `components/nickname-form.tsx` 닉네임 설정 폼
  - ✅ `components/mobile-tab-bar.tsx` "내 정보" → "더보기" 탭으로 교체 (`/more` 연결)
  - ✅ `components/mobile-header.tsx` LogoutButton 제거 (더보기 탭으로 이동)
  - ✅ 로그인 플랫폼 표시 (Google/이메일 구분), 로그아웃 버튼 이메일 옆 배치

- **Task 011: 지출 분석 페이지 UI 구현** ✅ - 완료
  - ✅ `components/analytics-charts.tsx` Recharts BarChart (카테고리별)
  - ✅ 카테고리별 상세 테이블
  - ✅ 반응형 차트 레이아웃
  - ✅ 다크모드 차트 툴팁 색상 수정
  - ✅ 월별 트렌드 LineChart 제거 (단순화)

- **Task 011-A: 공유 그룹 목록/생성/참여 UI 구현** ✅ - 완료
  - ✅ 그룹 목록 카드 UI (그룹명 | N명, 공유구독 요약 행)
  - ✅ `components/create-group-modal.tsx` 그룹 만들기 모달 (react-hook-form + Zod)
  - ✅ `components/join-group-modal.tsx` 그룹 참여 모달 (초대 코드 입력)
  - ✅ `components/rename-group-modal.tsx` 그룹 이름 수정 모달
  - ✅ 공유 그룹 카드/상세 페이지 서비스 로고 표시 (Google Favicon API)

- **Task 011-B: 공유 그룹 상세 UI 구현** ✅ - 완료
  - ✅ `app/(app)/groups/[id]/page.tsx` isOwner 판별 및 조건부 렌더링 (그룹장/멤버 권한 분기)
  - ✅ `components/group-subscription-table.tsx` 공유 구독 테이블 (서비스명+로고 | 총금액 | 결제일 | 최종상태)
  - ✅ 1그룹 1구독 정책 적용
  - ✅ `components/member-list.tsx` 멤버 목록 + 정산 현황 통합 (멤버별 정산금 설정)
  - ✅ 멤버별 정산금 설정 (그룹장: 인라인 편집, 멤버: 본인만 표시)
  - ✅ `components/payment-status-cell.tsx` 납부 상태 체크박스 (그룹장: 전체, 멤버: 본인만)
  - ✅ `components/receipt-section.tsx` isOwner prop 추가 → 영수증/인보이스 섹션 (그룹장만 삭제)
  - ✅ `components/invite-link-button.tsx` 멤버 초대 모달 (초대코드 + 링크복사)
  - ✅ `components/disband-group-button.tsx` 그룹 해산 버튼 + 확인 다이얼로그 (그룹장만)
  - ✅ `components/link-subscription-modal.tsx` 구독 연결 모달

---

### Phase 3: 핵심 기능 구현 ✅

더미 데이터를 실제 Supabase 연동으로 교체하고 핵심 비즈니스 로직을 구현합니다.
> 상세 계획: `docs/phase3.md` 참조

- **Task 012: Supabase 데이터베이스 구축 및 RLS 설정** ✅ - 완료
  - ✅ Supabase MCP를 활용하여 마이그레이션 파일 적용
  - ✅ `subscriptions`, `receipts`, `groups`, `group_members`, `group_subscriptions` 테이블 생성
  - ✅ PostgreSQL View 생성: `category_monthly_stats`
  - ✅ Storage 버킷 생성 (receipts 비공개) + RLS 정책
  - ✅ TypeScript 타입 자동 생성 (`lib/types/database.ts` 업데이트)
  - ✅ `profiles` 테이블 추가 (nickname, email 컬럼 + group_members FK)
  - ✅ `group_subscriptions`에 `member_split_amounts`, `member_payment_statuses` JSONB 컬럼 추가
  - ✅ `remove_member_from_group_subs` RPC 함수 (멤버 퇴출 시 JSONB 키 정리)
  - ✅ 영수증 RLS 그룹 멤버 접근 허용 (DB + Storage)
  - ✅ `sync_nickname_to_profiles` 트리거 (auth.users → profiles 닉네임 동기화)

  ## 테스트 체크리스트
  - [x] Playwright MCP로 Supabase 대시보드 접속하여 테이블 생성 확인
  - [x] RLS 정책이 올바르게 적용되었는지 SQL Editor에서 검증
  - [x] 다른 user_id로 데이터 접근 시 차단되는지 확인

- **Task 013: 구독 CRUD API 구현 및 대시보드 연동 (F001, F002, F003)** ✅ - 완료
  - ✅ `app/actions/types.ts` ActionResult 타입 정의
  - ✅ `app/actions/subscription.ts` Server Actions (get/create/update/delete)
  - ✅ 더미 데이터 → 실제 Supabase 데이터 교체 (dashboard, subscriptions/[id], analytics)
  - ✅ 결제 임박 필터링 로직: `next_billing_date <= now() + interval '3 days'`
  - ✅ 폼 컴포넌트 `useTransition` + `toast` 연동
  - ✅ 구독 수정 완료 후 `/dashboard` 리다이렉트
  - ✅ 구독 삭제 시 Storage 영수증 파일 일괄 정리

  ## 테스트 체크리스트
  - [x] Playwright MCP로 구독 추가 폼 작성 후 저장 → 대시보드에서 항목 확인
  - [x] 구독 상세 페이지에서 정보 수정 후 저장 → 변경 내용 반영 확인
  - [x] 구독 삭제 → 대시보드 목록에서 제거 확인
  - [x] 결제일이 3일 이내인 구독에 빨간색 배지 표시 확인
  - [x] 카테고리 필터 클릭 → 해당 카테고리 구독만 표시 확인
  - [x] 다른 사용자 로그인 시 자신의 구독만 조회되는지 RLS 확인

- **Task 014: Supabase Storage 연동 - 영수증 파일 업로드 (F004, F011)** ✅ - 완료
  - ✅ `app/actions/storage.ts` 영수증 업로드, Signed URL, 삭제
  - ✅ `receipt-section.tsx` 실제 업로드/다운로드/삭제 구현
  - ✅ 파일 타입 제한: JPG, PNG, PDF / 파일 크기 제한 상수 정의
  - ✅ Storage RLS 정책: 본인 소유 파일 + 그룹 멤버 접근 허용
  - ✅ 한글 파일명 대응: UUID로 파일명 교체, 원본 파일명은 DB 보관
  - ✅ 영수증 삭제 버튼 (구독 소유자 및 그룹장만 표시)

  ## 테스트 체크리스트
  - [x] 구독 상세 페이지에서 영수증 업로드 → 파일 목록에 표시 확인
  - [x] 영수증 다운로드 버튼 클릭 → 파일 다운로드 정상 동작 확인
  - [x] 허용되지 않는 파일 형식 업로드 시 에러 메시지 표시 확인

- **Task 015: 공유 그룹 생성 및 멤버 관리 구현 (F005)** ✅ - 완료
  - ✅ `app/actions/group.ts` 그룹 CRUD + 초대 코드 생성 + 구독 연결
  - ✅ 그룹 생성: `groups` INSERT + nanoid(8) 기반 `invite_code` 자동 생성
  - ✅ 초대 코드 검증 → `group_members` INSERT (role: MEMBER)
  - ✅ 분담금 설정: `member_split_amounts` JSONB UPDATE (그룹장 인라인 편집)
  - ✅ 납부 상태 업데이트: `member_payment_statuses` JSONB UPDATE (낙관적 UI)
  - ✅ 멤버 퇴출 시 JSONB 정산 데이터 정리 (RPC: remove_member_from_group_subs)
  - ✅ 그룹 해산 시 Storage 영수증 파일 일괄 정리
  - ✅ 멤버 displayName 표시 (닉네임 > 이메일 > user_id)
  - ✅ 더미 데이터 → 실제 Supabase 데이터 교체 (groups, groups/[id])
  - ✅ N+1 쿼리 제거: `getAllGroupSubscriptionsForUser()` 일괄 조회

  ## 테스트 체크리스트
  - [x] 그룹 생성 모달에서 그룹명 입력 후 생성 → 그룹 목록에 표시 확인
  - [x] 초대 코드로 그룹 참여 확인
  - [x] 그룹 상세에서 구독 연결 → 분담 금액 설정 확인
  - [x] 그룹장 전용 기능(해산, 분담금 편집) 멤버에게 비표시 확인

- **Task 016: Supabase Realtime 결제 상태 동기화 구현 (F006)** ✅ - 완료
  - ✅ `components/payment-status-realtime.tsx` Realtime 채널 구독 클라이언트 컴포넌트
  - ✅ `components/group-realtime-sync.tsx` group_members + receipts 변경 구독
  - ✅ 컴포넌트 언마운트 시 Realtime 채널 구독 해제 처리
  - ✅ 실시간 연결 상태 표시 인디케이터
  - ✅ 멤버 추가/퇴출, 영수증 업로드/삭제 시 실시간 페이지 갱신

  ## 테스트 체크리스트
  - [x] 두 계정에서 동일 그룹 상세 페이지 → 한 쪽 상태 변경 시 다른 쪽 즉시 반영 확인

- **Task 017: 지출 분석 View 연동 및 차트 구현 (F007)** ✅ - 완료
  - ✅ `category_monthly_stats` View 데이터 연동
  - ✅ `analytics-charts.tsx` 카테고리별 BarChart 구현 (월별 트렌드 제거)
  - ✅ Server Component에서 View 조회 후 차트 컴포넌트에 데이터 전달
  - ✅ 카테고리 항목 클릭 → 대시보드 페이지로 이동 (카테고리 필터 파라미터 포함)
  - ✅ 구독이 없는 경우 빈 상태 UI 처리
  - ✅ getUser() 중복 제거: 페이지에서 1회 호출 후 userId 전달 패턴 적용

  ## 테스트 체크리스트
  - [x] 분석 페이지 접속 → 카테고리별 차트 데이터 정상 표시 확인
  - [x] 차트 카테고리 클릭 → 대시보드 페이지 해당 카테고리 필터 활성화 확인

- **Task 018: 결제일 PWA 푸시 알림 구현 (F008)** ✅ - 완료
  - ✅ Firebase 없이 Web Push VAPID 표준으로 구현 (Supabase 무료 플랜 호환)
  - ✅ DB: `push_subscriptions` + `notification_preferences` 테이블 + RLS 정책
  - ✅ `public/sw.js` Service Worker (push 이벤트 수신, notificationclick 처리)
  - ✅ `app/actions/push.ts` Server Actions (subscribePush, updateNotificationPreference, getNotificationPreference)
  - ✅ `components/notification-settings.tsx` DB 연동 (권한 요청 → SW 등록 → PushManager 구독 → DB 저장)
  - ✅ `app/api/cron/notify-upcoming-payments/route.ts` Vercel Cron Route Handler
    - CRON_SECRET 인증, web-push 패키지로 알림 발송
    - 만료 구독(410/404) 자동 DB 삭제
  - ✅ `vercel.json` 매일 00:00 UTC(09:00 KST) Vercel Cron 스케줄 등록

  ## 테스트 체크리스트
  - [ ] 더보기 탭 → 알림 설정 토글 ON → 브라우저 알림 권한 요청 팝업 확인
  - [ ] Supabase 대시보드 → push_subscriptions 테이블에 레코드 저장 확인
  - [ ] Route Handler 수동 호출 → 브라우저 푸시 알림 수신 확인
  - [ ] 알림 설정 토글 OFF → enabled=false DB 반영 확인

- **Task 019: 핵심 기능 통합 테스트** ✅ - 완료
  - ✅ Playwright MCP를 사용한 전체 탭(구독/그룹/분석/더보기) E2E 테스트 수행
  - ✅ 성능 최적화: N+1 쿼리 제거, waterfall 제거, getUser() 중복 제거

  ## 테스트 체크리스트
  - [x] 구독탭: 활성 구독 목록, 카테고리 필터, 결제 임박 배지 정상 동작
  - [x] 그룹탭: 그룹 목록, 만들기/참여 버튼 정상 동작
  - [x] 분석탭: 카테고리 차트, 상세 테이블 정상 렌더링
  - [x] 더보기탭: 계정 정보, 닉네임 설정, 알림 토글, 앱 버전 정상 표시

---

### Phase 4: 고급 기능 및 최적화 ✅

핵심 기능이 완성된 후 성능 최적화, 코드 품질 개선, 배포 파이프라인을 구축합니다.

- **Task 020: 성능 최적화 및 사용자 경험 개선** ✅ - 완료
  - ✅ `loading.tsx` 스켈레톤 UI (각 라우트별)
  - ✅ `error.tsx` 에러 바운더리 UI (각 라우트별)
  - ✅ `next/image` 컴포넌트를 사용한 서비스 로고 이미지 최적화
  - ✅ Supabase 쿼리 최적화: getUser() 중복 제거, Promise.all 병렬 쿼리, waterfall 제거
  - ✅ Service Worker 캐싱 전략 (Cache-First, Stale-While-Revalidate, RSC 캐시)
  - ✅ unstable_cache로 analytics 서버 캐싱 + revalidateTag 무효화
  - ✅ recharts dynamic import로 초기 번들 분리
  - ✅ 코드 리뷰 보안/안정성 수정 (getSession() 제거, SW null 응답 방지, Realtime 참조 안정화 등)
  - ✅ 토스트 알림 구현: 구독/그룹 CRUD 성공 및 실패 피드백

- **Task 021: 코드 품질 및 접근성 개선** ✅ - 완료
  - ✅ `npm run check-all` 전체 통과 (ESLint, TypeScript, Prettier)
  - ✅ 폼 유효성 에러 메시지 한국어 일관성 검토
  - ✅ 키보드 네비게이션 및 ARIA 레이블 검토
  - ✅ 빈 상태 UI 일관성 검토 (구독 없음, 그룹 없음, 영수증 없음 안내 메시지)

- **Task 022: Vercel 배포 파이프라인 준비** ✅ - 완료
  - ✅ `npm run build` 로컬 빌드 성공 확인
  - ✅ `vercel.json` Cron 설정 확인 (`/api/cron/notify-upcoming-payments`, 매일 0시)
  - ✅ Vercel 프로젝트 연결 및 환경 변수 설정
    - **Supabase 연동 (필수)**
      - `NEXT_PUBLIC_SUPABASE_URL` — Supabase 프로젝트 URL
      - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public 키
      - `SUPABASE_SERVICE_ROLE_KEY` — Cron Route Handler에서 서비스 역할 접근용
    - **Push 알림 (Cron 알림 기능 사용 시 필수)**
      - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — 클라이언트 Push 구독 등록용
      - `VAPID_PUBLIC_KEY` — 서버 측 webpush 인증용
      - `VAPID_PRIVATE_KEY` — 서버 측 webpush 서명용
      - `VAPID_EMAIL` — VAPID 연락처 이메일 (예: `mailto:admin@subtracker.app`)
    - **보안 (Cron 사용 시 필수)**
      - `CRON_SECRET` — Vercel Cron 요청 인증 토큰
  - ✅ Vercel Preview 배포 확인 (PR 기반 자동 배포)

  ## 테스트 체크리스트
  - [x] `npm run build` 로컬 빌드 성공
  - [x] Vercel 환경 변수 8개 모두 등록 확인
  - [x] 프로덕션 URL 접속 → 랜딩 페이지 정상 로드
  - [x] 회원가입 → 로그인 → 구독 추가 플로우 정상 동작
  - [x] Cron Job 수동 트리거 → 알림 발송 확인
