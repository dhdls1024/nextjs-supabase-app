// Route: /subscriptions/[id]
// Features: F001, F004, F011
// 구독 상세 페이지 — 수정 폼과 영수증 섹션으로 구성
// cacheComponents 환경: params await와 데이터 조회를 모두 Suspense 경계 안에서 처리

import { notFound } from "next/navigation"
import { Suspense } from "react"

import { getReceipts } from "@/app/actions/storage"
import { getSubscription } from "@/app/actions/subscription"
import { PageHeader } from "@/components/page-header"
import { ReceiptSection } from "@/components/receipt-section"
import { SubscriptionEditForm } from "@/components/subscription-edit-form"

// 구독 데이터를 조회하고 폼을 렌더링하는 내부 Server Component
// Suspense 경계 안에서 실행되어 cacheComponents와 호환됨
async function SubscriptionDetailContent({ params }: { params: Promise<{ id: string }> }) {
  // Next.js 15: params는 Promise이므로 반드시 await 필요
  const { id } = await params
  // 구독 정보와 영수증 목록을 병렬로 조회하여 성능 최적화
  const [subscription, receipts] = await Promise.all([getSubscription(id), getReceipts(id)])
  if (!subscription) notFound()

  return (
    <>
      <PageHeader title={subscription.name} description="구독 서비스 상세 정보 및 영수증 관리" />
      <SubscriptionEditForm subscription={subscription} />
      {/* 개인 구독 페이지는 항상 본인 소유이므로 isOwner={true} */}
      <ReceiptSection subscriptionId={id} initialReceipts={receipts} isOwner={true} />
    </>
  )
}

// SubscriptionDetailPage: 구독 상세 정보 페이지 (Server Component)
export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="space-y-8">
      {/* Suspense 경계 — params await와 데이터 조회를 모두 감쌈 */}
      <Suspense
        fallback={
          <div className="py-8 text-center text-sm text-muted-foreground">불러오는 중...</div>
        }
      >
        <SubscriptionDetailContent params={params} />
      </Suspense>
    </div>
  )
}
