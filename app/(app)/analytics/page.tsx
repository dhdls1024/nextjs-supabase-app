// Route: /analytics
// Features: F007
// 지출 분석 페이지 - 카테고리별 차트, 상세 테이블 제공

import dynamic from "next/dynamic"
import Link from "next/link"
import { Suspense } from "react"

import { getCategoryMonthlyStatsByUserId } from "@/app/actions/analytics"
import { getSubscriptionsByUserId } from "@/app/actions/subscription"
import { AmountDisplay } from "@/components/amount-display"
import { PageHeader } from "@/components/page-header"
import { createClient } from "@/lib/supabase/server"
import type { Subscription } from "@/lib/types/database"
import { CATEGORIES } from "@/lib/types/index"

// recharts는 약 300KB 라이브러리 — dynamic import로 초기 번들에서 분리
const AnalyticsCharts = dynamic(
  () => import("@/components/analytics-charts").then((m) => ({ default: m.AnalyticsCharts })),
  {
    // 차트 로딩 중 스켈레톤 표시
    loading: () => (
      <div className="h-[280px] w-full animate-pulse rounded-2xl bg-muted" aria-hidden="true" />
    ),
  }
)

// 카테고리별 색상 닷 매핑 (인디고/남색 계열 기반)
const CATEGORY_DOT_COLORS: Record<string, string> = {
  OTT: "#4f6cdc",
  MUSIC: "#ec4899",
  GAME: "#22c55e",
  NEWS: "#0ea5e9",
  SOFTWARE: "#eab308",
  OTHER: "#94a3b8",
}

// 분석 데이터를 조회하고 렌더링하는 내부 Server Component
async function AnalyticsContent() {
  // getUser()를 한 번만 호출하여 인증 확인 및 userId 획득
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // userId를 직접 전달하여 getUser() 중복 호출 방지
  const [subscriptions, categoryMonthlyStats] = await Promise.all([
    getSubscriptionsByUserId(user.id),
    getCategoryMonthlyStatsByUserId(user.id),
  ])

  // 구독이 없는 경우 빈 상태 UI 표시
  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-base font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
          등록된 구독이 없습니다.
        </p>
        <p className="mt-2 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          구독을 추가하면 지출 분석을 확인할 수 있습니다.
        </p>
      </div>
    )
  }

  // category_monthly_stats View 데이터가 있으면 View 사용, 없으면 클라이언트 집계로 폴백
  const categoryStats =
    categoryMonthlyStats.length > 0
      ? CATEGORIES.map((cat) => {
          const stat = categoryMonthlyStats.find((s) => s.category === cat.value)
          return { category: cat.label, total: stat?.total_amount ?? 0 }
        })
      : CATEGORIES.map((cat) => ({
          category: cat.label,
          total: subscriptions
            .filter((s: Subscription) => s.category === cat.value && s.status === "ACTIVE")
            .reduce((sum: number, s: Subscription) => sum + s.amount, 0),
        }))

  // 이번 달 총 지출 — ACTIVE 구독 전체 금액 합산
  const totalMonthly = subscriptions
    .filter((s: Subscription) => s.status === "ACTIVE")
    .reduce((sum: number, s: Subscription) => sum + s.amount, 0)

  // 카테고리별 구독 상세 (테이블용)
  const categoryDetails = CATEGORIES.map((cat) => {
    const subs = subscriptions.filter((s: Subscription) => s.category === cat.value)
    const activeSubs = subs.filter((s: Subscription) => s.status === "ACTIVE")
    return {
      value: cat.value,
      label: cat.label,
      count: subs.length,
      total: activeSubs.reduce((sum: number, s: Subscription) => sum + s.amount, 0),
    }
  })

  return (
    <div className="space-y-5">
      {/* 이번 달 총 지출 — 그라데이션 강조 카드 */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: "var(--glow-primary)",
        }}
      >
        <p className="text-xs font-medium text-white/70">이번 달 총 지출</p>
        <p
          className="display-number mt-1.5 text-3xl font-bold text-white"
          style={{ fontFamily: "'Sora', sans-serif" }}
        >
          <AmountDisplay amount={totalMonthly} />
        </p>
      </div>

      {/* Recharts 차트 영역 */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <AnalyticsCharts categoryStats={categoryStats} />
      </div>

      {/* 카테고리별 상세 목록 */}
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div className="border-b px-5 py-4" style={{ borderColor: "hsl(var(--border))" }}>
          <h2 className="text-sm font-semibold" style={{ fontFamily: "'Sora', sans-serif" }}>
            카테고리별 상세
          </h2>
        </div>

        <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
          {categoryDetails.map((detail) => (
            <div key={detail.label} className="flex items-center gap-3 px-5 py-4">
              {/* 카테고리 색상 닷 */}
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CATEGORY_DOT_COLORS[detail.value] ?? "#94a3b8" }}
              />
              {/* 카테고리명 — 클릭 시 대시보드 필터로 이동 */}
              <Link
                href={`/dashboard?category=${detail.value}`}
                className="flex-1 text-sm font-medium transition-colors hover:underline"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {detail.label}
              </Link>
              {/* 구독 수 */}
              <span className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                {detail.count}개
              </span>
              {/* 월 지출 합계 */}
              <span
                className="display-number text-sm font-semibold"
                style={{
                  color:
                    detail.total > 0 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                <AmountDisplay amount={detail.total} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-0">
      <PageHeader title="지출 분석" description="구독 서비스별 지출 현황" />

      {/* Suspense 경계 — 스켈레톤 fallback */}
      <Suspense
        fallback={
          <div className="space-y-5" aria-hidden="true">
            <div className="h-[88px] animate-pulse rounded-2xl bg-muted" />
            <div className="h-[280px] animate-pulse rounded-2xl bg-muted" />
            <div className="space-y-0 overflow-hidden rounded-2xl">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[56px] animate-pulse border-b border-background bg-muted"
                />
              ))}
            </div>
          </div>
        }
      >
        <AnalyticsContent />
      </Suspense>
    </div>
  )
}
