// Route: /dashboard
// Features: F002, F003
// 요약 통계(활성 구독 수, 결제 임박 수)와 카테고리별 구독 목록을 표시하는 대시보드 페이지

import { CreditCard } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { advanceOverdueBillingDates, getSubscriptionsByUserId } from "@/app/actions/subscription"
import { AmountDisplay } from "@/components/amount-display"
import { CategoryFilter } from "@/components/category-filter"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import type { Subscription } from "@/lib/types/database"

// 결제 임박 판단 기준 일수 상수 (오늘 포함 N일 이내)
const URGENT_DAYS_THRESHOLD = 3

// 결제 임박 여부 계산 — next_billing_date가 오늘 기준 3일 이내인지 판단
function checkIsUrgent(nextBillingDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const billingDate = new Date(nextBillingDate)
  billingDate.setHours(0, 0, 0, 0)
  const diff = Math.ceil((billingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff >= 0 && diff <= URGENT_DAYS_THRESHOLD
}

// 구독 목록과 요약 카드를 함께 렌더링하는 내부 Server Component
async function DashboardContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = (await searchParams) ?? {}

  // getUser()를 한 번만 호출하여 인증 확인 및 userId 획득
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 결제일이 지난 구독 먼저 갱신
  await advanceOverdueBillingDates(user.id)

  // userId를 직접 전달하여 getUser() 중복 호출 방지
  const subscriptions = await getSubscriptionsByUserId(user.id)

  // 구독이 0개일 때 빈 상태 안내 UI 표시
  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            border: "1px solid hsl(var(--primary) / 0.2)",
          }}
        >
          <CreditCard className="h-9 w-9" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <p className="mb-1 text-lg font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
          구독이 없습니다
        </p>
        <p className="mb-7 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
          첫 번째 구독을 추가해보세요.
        </p>
        <Button asChild className="rounded-xl px-6">
          <Link href="/subscriptions/new">+ 구독 추가</Link>
        </Button>
      </div>
    )
  }

  const activeCount = subscriptions.filter((s: Subscription) => s.status === "ACTIVE").length
  const urgentCount = subscriptions.filter((s: Subscription) =>
    checkIsUrgent(s.next_billing_date)
  ).length

  // 이번 달 총 지출 계산 (ACTIVE 구독만)
  const totalMonthly = subscriptions
    .filter((s: Subscription) => s.status === "ACTIVE")
    .reduce((sum: number, s: Subscription) => sum + s.amount, 0)

  return (
    <>
      {/* 요약 통계 카드 그리드 */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {/* 총 지출 — 넓은 카드 */}
        <div
          className="col-span-3 rounded-2xl p-4"
          style={{
            background: "var(--gradient-primary)",
            boxShadow: "var(--glow-primary)",
          }}
        >
          <p className="text-xs font-medium text-white/70">이번 달 총 구독 지출</p>
          <p
            className="display-number mt-1 text-2xl font-bold text-white"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            <AmountDisplay amount={totalMonthly} />
          </p>
        </div>

        {/* 활성 구독 수 카드 */}
        <div
          className="col-span-2 rounded-2xl p-4"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <p className="text-xs font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
            활성 구독
          </p>
          <p
            className="display-number mt-1 text-2xl font-bold"
            style={{ fontFamily: "'Sora', sans-serif", color: "hsl(var(--foreground))" }}
          >
            {activeCount}
            <span
              className="ml-1 text-sm font-normal"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              개
            </span>
          </p>
        </div>

        {/* 결제 임박 카드 */}
        <div
          className="col-span-1 rounded-2xl p-4"
          style={{
            background: urgentCount > 0 ? "rgba(249, 115, 22, 0.1)" : "hsl(var(--card))",
            border:
              urgentCount > 0
                ? "1px solid rgba(249, 115, 22, 0.3)"
                : "1px solid hsl(var(--border))",
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: urgentCount > 0 ? "#f97316" : "hsl(var(--muted-foreground))" }}
          >
            결제 임박
          </p>
          <p
            className="display-number mt-1 text-2xl font-bold"
            style={{
              fontFamily: "'Sora', sans-serif",
              color: urgentCount > 0 ? "#f97316" : "hsl(var(--foreground))",
            }}
          >
            {urgentCount}
          </p>
        </div>
      </div>

      <CategoryFilter subscriptions={subscriptions} initialCategory={category} />
    </>
  )
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  return (
    <div>
      {/* 페이지 헤더 */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            내 구독
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            구독 서비스를 한눈에
          </p>
        </div>
        <Button asChild size="sm" className="rounded-xl">
          <Link href="/subscriptions/new">+ 추가</Link>
        </Button>
      </div>

      {/* Suspense 경계 — 스켈레톤 fallback */}
      <Suspense
        fallback={
          <div className="space-y-3" aria-hidden="true">
            {/* 총 지출 스켈레톤 */}
            <div className="h-[76px] animate-pulse rounded-2xl bg-muted" />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 h-20 animate-pulse rounded-2xl bg-muted" />
              <div className="col-span-1 h-20 animate-pulse rounded-2xl bg-muted" />
            </div>
            {/* 카드 목록 스켈레톤 */}
            <div className="mt-5 h-12 animate-pulse rounded-xl bg-muted" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[108px] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        }
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
