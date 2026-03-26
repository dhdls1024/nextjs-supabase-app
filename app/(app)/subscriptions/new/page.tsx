// Route: /subscriptions/new
// Features: F001, F011
// 구독 서비스 추가 페이지 — Server Component

import { PageHeader } from "@/components/page-header"
import { SubscriptionForm } from "@/components/subscription-form"

export default function NewSubscriptionPage() {
  return (
    <div>
      {/* 페이지 상단 제목 및 설명 */}
      <PageHeader title="구독 추가" description="새로운 구독 서비스를 추가합니다." />

      {/* 구독 추가 폼 — Client Component */}
      <SubscriptionForm />
    </div>
  )
}
