// Route: /analytics
// Features: F007
// 지출 분석 페이지 - 카테고리별 차트, 상세 테이블 제공
// cacheComponents 환경: 데이터 조회를 Suspense 경계 안에서 처리
// View: category_monthly_stats 사용

import dynamic from "next/dynamic"
import Link from "next/link"
import { Suspense } from "react"

import { getCategoryMonthlyStatsByUserId } from "@/app/actions/analytics"
import { getSubscriptionsByUserId } from "@/app/actions/subscription"
import { AmountDisplay } from "@/components/amount-display"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"
import type { Subscription } from "@/lib/types/database"
import { CATEGORIES } from "@/lib/types/index"

// recharts는 약 300KB 라이브러리 — dynamic import로 초기 번들에서 분리
// analytics 페이지 진입 시에만 로드되도록 지연 로딩 적용
// ssr: false — recharts는 브라우저 DOM에 의존하므로 서버 렌더링 불필요
const AnalyticsCharts = dynamic(
  () => import("@/components/analytics-charts").then((m) => ({ default: m.AnalyticsCharts })),
  {
    // 차트 로딩 중 스켈레톤 표시 — CLS(Cumulative Layout Shift) 방지
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-lg bg-muted" aria-hidden="true" />
    ),
    ssr: false,
  }
)

// 분석 데이터를 조회하고 렌더링하는 내부 Server Component
// Suspense 경계 안에서 실행되어 cacheComponents와 호환됨
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
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">등록된 구독이 없습니다.</p>
        <p className="mt-2 text-sm">구독을 추가하면 지출 분석을 확인할 수 있습니다.</p>
      </div>
    )
  }

  // category_monthly_stats View 데이터가 있으면 View 사용, 없으면 클라이언트 집계로 폴백
  // View는 최신 월 데이터만 반환하므로 카테고리 레이블로 매핑 필요
  const categoryStats =
    categoryMonthlyStats.length > 0
      ? CATEGORIES.map((cat) => {
          // View 데이터에서 현재 카테고리의 가장 최신 월 지출 합계를 찾음
          const stat = categoryMonthlyStats.find((s) => s.category === cat.value)
          return {
            category: cat.label,
            total: stat?.total_amount ?? 0,
          }
        })
      : // View 데이터가 없으면 구독 데이터에서 클라이언트 집계
        CATEGORIES.map((cat) => ({
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
    <>
      {/* 이번 달 총 지출 요약 카드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            이번 달 총 지출
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            <AmountDisplay amount={totalMonthly} />
          </p>
        </CardContent>
      </Card>

      {/* Recharts 차트 — dynamic import로 지연 로딩 (초기 번들 분리) */}
      <AnalyticsCharts categoryStats={categoryStats} />

      <Separator />

      {/* 카테고리별 상세 테이블 */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">카테고리별 상세</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>카테고리</TableHead>
              <TableHead>전체 구독 수</TableHead>
              <TableHead>월 지출 합계 (활성)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categoryDetails.map((detail) => (
              <TableRow key={detail.label}>
                {/* 카테고리 클릭 → 대시보드에 카테고리 필터 파라미터 전달 */}
                <TableCell>
                  <Link
                    href={`/dashboard?category=${detail.value}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {detail.label}
                  </Link>
                </TableCell>
                <TableCell>{detail.count}개</TableCell>
                <TableCell>
                  <AmountDisplay amount={detail.total} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="지출 분석" description="구독 서비스별 지출 현황을 분석합니다." />

      {/* Suspense 경계 — 스켈레톤 fallback으로 CLS(레이아웃 이동) 방지 */}
      <Suspense
        fallback={
          <div className="space-y-6" aria-hidden="true">
            {/* 총 지출 카드 스켈레톤 */}
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
            {/* 차트 영역 스켈레톤 — 실제 차트 높이(300px)와 동일 */}
            <div className="h-[300px] animate-pulse rounded-lg bg-muted" />
            {/* 테이블 스켈레톤 */}
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-muted" />
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
