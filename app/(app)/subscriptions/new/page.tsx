// Route: /subscriptions/new
// Features: F001, F011
// 구독 서비스 추가 페이지 — Server Component

import { getServicePresets } from "@/app/actions/subscription"
import { PageHeader } from "@/components/page-header"
import { SubscriptionForm } from "@/components/subscription-form"

export default async function NewSubscriptionPage() {
  // SSR 시점에 서비스 프리셋 데이터 조회 — prop으로 전달하여 로딩 깜빡임 방지
  const servicePresets = await getServicePresets()

  return (
    <div>
      {/* 페이지 상단 제목 및 설명 */}
      <PageHeader title="구독 추가" description="새로운 구독 서비스를 추가합니다." />

      {/* 구독 추가 폼 — Client Component */}
      <SubscriptionForm servicePresets={servicePresets} />
    </div>
  )
}
