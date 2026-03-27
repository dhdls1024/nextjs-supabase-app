// SubTracker UI 공통 타입 및 상수 정의

// 구독 카테고리 유니온 타입
export type SubscriptionCategory = "OTT" | "AI" | "SHOPPING" | "MUSIC" | "OTHER"

// 결제 주기 유니온 타입
export type BillingCycle = "MONTHLY" | "YEARLY"

// 구독 상태 유니온 타입
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED"

// 그룹 멤버 역할 유니온 타입
export type MemberRole = "OWNER" | "MEMBER"

// 정산 상태 유니온 타입
export type PaymentStatus = "PENDING" | "PAID"

// 카테고리별 월 지출 집계 View 타입
export type CategoryMonthlyStat = {
  category: SubscriptionCategory
  month: string // YYYY-MM 형식
  total_amount: number
}

// 최근 6개월 월별 지출 트렌드 View 타입
export type MonthlyTrendStat = {
  month: string // YYYY-MM 형식
  total_amount: number
}

// 카테고리 선택 옵션 상수 (as const로 타입 추론 활용)
export const CATEGORIES = [
  { value: "OTT", label: "OTT" },
  { value: "AI", label: "AI" },
  { value: "SHOPPING", label: "쇼핑" },
  { value: "MUSIC", label: "음악" },
  { value: "OTHER", label: "기타" },
] as const

// 결제 주기 선택 옵션 상수
export const BILLING_CYCLES = [
  { value: "MONTHLY", label: "월간" },
  { value: "YEARLY", label: "연간" },
] as const

// 구독 상태 선택 옵션 상수
export const SUBSCRIPTION_STATUSES = [
  { value: "ACTIVE", label: "활성" },
  { value: "PAUSED", label: "일시정지" },
  { value: "CANCELLED", label: "해지" },
] as const

// analytics 캐시 TTL (초) — 통계 데이터는 변경 빈도가 낮으므로 5분 캐시 적용
// "use server" 파일에서 상수 export가 금지되므로 이 파일로 분리
export const ANALYTICS_CACHE_TTL = 300
