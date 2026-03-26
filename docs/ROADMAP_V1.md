# SubTracker 개발 로드맵

여러 곳에 흩어진 정기 구독 서비스를 한 곳에서 통합 관리하고 불필요한 지출을 방지하는 구독 관리 앱.

**📅 최종 업데이트**: 2026-03-24
**📊 진행 상황**: Phase 2 진행 중 (13/24 Tasks 완료)

---

## 개요

SubTracker는 개인 또는 가족/친구와 OTT, 클라우드, SaaS 구독을 공유하며 비용을 관리하는 사용자를 위해 다음 기능을 제공합니다:

- **구독 통합 관리**: 모든 구독 서비스를 한 곳에서 추가, 수정, 삭제하고 결제 임박 항목을 즉시 파악
- **공유 그룹**: 가족/친구와 공유 구독을 그룹으로 관리하고 분담 금액을 실시간으로 동기화
- **지출 분석**: 카테고리별 월 지출 통계와 월별 트렌드 차트로 구독 비용 최적화 의사결정 지원
- **영수증 스토리지**: 구독별 영수증/인보이스 파일을 Supabase Storage에 업로드하고 언제든 다운로드
- **자동 이메일 알림**: Edge Functions + pg_cron + Resend로 결제일 3일 전 자동 알림 발송

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
  - ✅ `CategoryMonthlyStat`, `MonthlyTrendStat` View 타입 정의

- **Task 004: 데이터베이스 스키마 설계 및 마이그레이션 파일 작성** ✅ - 완료
  - ✅ `supabase/migrations/001_create_subtracker_schema.sql` 생성
  - ✅ 5개 테이블 DDL 작성 (subscriptions, receipts, groups, group_members, group_subscriptions)
  - ✅ PostgreSQL View DDL 작성 (category_monthly_stats, monthly_trend_stats)
  - ✅ RLS 정책 설계 및 문서화

---

### Phase 2: UI/UX 완성 (더미 데이터 활용)

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
  - ✅ 핵심 기능 3가지 카드 섹션
  - ✅ sticky 네비게이션 + ThemeSwitcher
  - ✅ 푸터 카피라이트

- **Task 007: 대시보드 페이지 UI 구현** ✅ - 완료
  - ✅ 요약 카드 3개 (월 총 지출, 활성 구독 수, 결제 임박)
  - ✅ `components/category-filter.tsx` 카테고리 필터 탭 + 구독 목록 테이블
  - ✅ UrgentBadge, StatusBadge 적용
  - ✅ 행 클릭 → 상세 페이지 이동

- **Task 008: 구독 추가 페이지 UI 구현** ✅ - 완료
  - ✅ `components/subscription-form.tsx` react-hook-form + Zod
  - ✅ 8개 필드 (name, category, amount, billing_cycle, next_billing_date, status, notes, logo_url)
  - ✅ 로고 URL 미리보기

- **Task 009: 구독 상세 페이지 UI 구현** ✅ - 완료
  - ✅ `components/subscription-edit-form.tsx` 초기값 설정
  - ✅ `components/delete-subscription-dialog.tsx` 삭제 확인 다이얼로그
  - ✅ `components/receipt-section.tsx` 파일 업로드 드롭존 + 목록 테이블

- **Task 010: 공유 그룹 목록 및 상세 페이지 UI 구현** ✅ - 완료
  - ✅ `app/(app)/groups/page.tsx` 그룹 카드 목록
  - ✅ `components/create-group-modal.tsx` 그룹 생성 모달
  - ✅ `components/join-group-form.tsx` 초대 코드 입력
  - ✅ `app/(app)/groups/[id]/page.tsx` 상세 (공유 구독 테이블, 멤버 목록, 영수증)
  - ✅ `components/invite-link-button.tsx` 초대 링크 클립보드 복사

- **Task 011: 지출 분석 페이지 UI 구현** ✅ - 완료
  - ✅ `components/analytics-charts.tsx` Recharts BarChart
  - ✅ 카테고리별 상세 테이블
  - ✅ 반응형 차트 레이아웃

- **Task 011-A: 더보기 탭 및 설정 페이지 구현** ✅ - 완료
  - ✅ `app/(app)/more/page.tsx` 생성 (계정 정보, 알림설정, 앱 버전, 로그아웃)
  - ✅ `components/notification-settings.tsx` 결제일 알림 토글 + D-day 시점 선택
  - ✅ `components/mobile-tab-bar.tsx` "내 정보" → "더보기" 탭으로 교체 (`/more` 연결)
  - ✅ `components/mobile-header.tsx` LogoutButton 제거 (더보기 탭으로 이동)
  - ✅ `components/logout-button.tsx` className prop 추가, 한국어 텍스트 적용

- **Task 011-B: 그룹장 관리 기능 UI 구현** - 진행 예정
  - [ ] `app/(app)/groups/[id]/page.tsx` isOwner 판별 및 조건부 렌더
  - [ ] `components/group-subscription-table.tsx` 공유 구독 테이블 (구독 연결/해제, 분담금 수정)
  - [ ] `components/payment-status-cell.tsx` 결제 상태 토글 (그룹장: 전체, 멤버: 본인만)
  - [ ] `components/member-list.tsx` 멤버 목록 + 그룹장 전용 퇴출 버튼
  - [ ] `components/link-subscription-modal.tsx` 구독 연결 모달
  - [ ] `components/disband-group-button.tsx` 그룹 해산 버튼 + 확인 다이얼로그
  - [ ] `components/receipt-section.tsx` isOwner prop 추가 → 그룹장 전용 파일 삭제 버튼

---

### Phase 3: 핵심 기능 구현

더미 데이터를 실제 Supabase 연동으로 교체하고 핵심 비즈니스 로직을 구현합니다.
> 상세 계획: `docs/phase3.md` 참조

- **Task 012: Supabase 데이터베이스 구축 및 RLS 설정**
  - Supabase MCP를 활용하여 마이그레이션 파일 적용
  - Storage 버킷 생성 (logos 공개, receipts 비공개) + RLS 정책
  - TypeScript 타입 자동 생성 (`lib/types/database.ts` 업데이트)

  ## 테스트 체크리스트
  - [ ] 테이블 생성 확인
  - [ ] RLS 정책 검증
  - [ ] 다른 user_id로 데이터 접근 시 차단 확인

- **Task 013: 구독 CRUD API 구현 및 대시보드 연동 (F001, F002, F003)**
  - `app/actions/types.ts` ActionResult 타입
  - `app/actions/subscription.ts` Server Actions (get/create/update/delete)
  - 더미 데이터 → 실제 Supabase 데이터 교체 (dashboard, subscriptions/[id], analytics)
  - 폼 컴포넌트 `useTransition` + `toast` 연동

  ## 테스트 체크리스트
  - [ ] 구독 추가 → 대시보드 반영
  - [ ] 구독 수정/삭제 확인
  - [ ] 결제 임박 배지 표시 확인
  - [ ] RLS 확인 (타 사용자 구독 차단)

- **Task 014: Supabase Storage 연동 (F004, F011)**
  - `app/actions/storage.ts` 로고/영수증 업로드, Signed URL, 삭제
  - `receipt-section.tsx` 실제 업로드/다운로드 구현

  ## 테스트 체크리스트
  - [ ] 로고 업로드 → 목록 표시
  - [ ] 영수증 업로드/다운로드
  - [ ] 잘못된 파일 형식 에러 처리

- **Task 015: 공유 그룹 생성 및 멤버 관리 구현 (F005)**
  - `app/actions/group.ts` 그룹 CRUD + 초대 코드 + 구독 연결
  - `app/(app)/groups/join/page.tsx` 초대 링크 처리

  ## 테스트 체크리스트
  - [ ] 그룹 생성 → 목록 표시
  - [ ] 초대 링크로 참여
  - [ ] 구독 연결 → 분담금 계산

- **Task 016: Supabase Realtime 결제 상태 동기화 구현 (F006)**
  - `components/payment-status-realtime.tsx` Realtime 채널 구독
  - `app/actions/payment.ts` 결제 상태 UPDATE

  ## 테스트 체크리스트
  - [ ] 두 탭에서 실시간 상태 변경 확인
  - [ ] 네트워크 재연결 후 복구 확인

- **Task 017: 지출 분석 View 연동 및 차트 구현 (F007)**
  - `category_monthly_stats`, `monthly_trend_stats` View 연동
  - `analytics-charts.tsx` MonthlyTrendLineChart 추가

  ## 테스트 체크리스트
  - [ ] 카테고리별 차트 데이터 표시
  - [ ] 월별 트렌드 6개월 데이터 표시

- **Task 018: 결제 임박 이메일 알림 자동화 (F008)**
  - Resend SDK + Edge Function `notify-upcoming-payments`
  - pg_cron 매일 UTC 0시 스케줄 등록

  ## 테스트 체크리스트
  - [ ] Edge Function 수동 호출 → 이메일 수신
  - [ ] pg_cron 등록 확인

- **Task 019: 핵심 기능 통합 테스트**
  - Playwright MCP E2E 테스트

  ## 테스트 체크리스트
  - [ ] 회원가입 → 로그인 → 구독 추가 → 대시보드 전체 플로우
  - [ ] 구독 → 그룹 생성 → 구독 연결 → 실시간 상태 변경
  - [ ] 구독 → 영수증 업로드 → 다운로드
  - [ ] 비인증 상태 보호 경로 리다이렉트 확인
  - [ ] RLS: 타 계정 데이터 접근 불가 확인

---

### Phase 4: 고급 기능 및 최적화

핵심 기능이 완성된 후 성능 최적화, 코드 품질 개선, 배포 파이프라인을 구축합니다.

- **Task 020: 성능 최적화 및 사용자 경험 개선**
  - `loading.tsx` 스켈레톤 UI (각 라우트)
  - `error.tsx` 에러 바운더리 UI (각 라우트)
  - `next/image` 로고 이미지 최적화
  - 토스트 알림 (구독 CRUD 성공/실패)

- **Task 021: 코드 품질 및 접근성 개선**
  - `npm run check-all` 전체 통과
  - 폼 유효성 에러 메시지 한국어 일관성
  - 빈 상태 UI 일관성 검토

- **Task 022: Vercel 배포 파이프라인 구축**
  - Vercel 프로젝트 연결 + 환경 변수 설정
  - Preview 배포 확인
  - 프로덕션 E2E 검증

  ## 테스트 체크리스트
  - [ ] 프로덕션 랜딩 페이지 로드 확인
  - [ ] 프로덕션 회원가입 → 구독 추가 플로우
  - [ ] 프로덕션 파일 업로드/다운로드 확인
