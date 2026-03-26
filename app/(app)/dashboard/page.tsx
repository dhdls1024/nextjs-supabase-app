// Route: /dashboard
// Features: F002, F003
// 요약 통계(활성 구독 수, 결제 임박 수)와 카테고리별 구독 목록을 표시하는 대시보드 페이지
// cacheComponents 환경: 데이터 조회를 Suspense 경계 안에서 처리

import Link from "next/link"
import { Suspense } from "react"

import { getSubscriptionsByUserId } from "@/app/actions/subscription"
import { CategoryFilter } from "@/components/category-filter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
// Suspense 경계 안에서 실행되어 cacheComponents와 호환됨
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

  // userId를 직접 전달하여 getUser() 중복 호출 방지
  const subscriptions = await getSubscriptionsByUserId(user.id)

  const activeCount = subscriptions.filter((s: Subscription) => s.status === "ACTIVE").length
  const urgentCount = subscriptions.filter((s: Subscription) =>
    checkIsUrgent(s.next_billing_date)
  ).length

  return (
    <>
      <CategoryFilter subscriptions={subscriptions} initialCategory={category} />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">활성 구독</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeCount}개</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">결제 임박</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{urgentCount}개</p>
          </CardContent>
        </Card>
      </div>
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
      {/* 페이지 헤더 - 제목과 구독 추가 버튼 */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">구독</h1>
        <Button asChild>
          <Link href="/subscriptions/new">+ 구독 추가</Link>
        </Button>
      </div>

      {/* Suspense 경계 — cacheComponents와 호환되도록 데이터 조회를 감쌈 */}
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
        }
      >
        <DashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
