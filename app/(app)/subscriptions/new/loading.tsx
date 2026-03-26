// Route: /subscriptions/new — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: PageHeader(제목+설명) + SubscriptionForm(입력 필드 5개 + 버튼)
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function NewSubscriptionLoading() {
  return (
    <div>
      {/* PageHeader 스켈레톤 — 제목 + 설명 */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* SubscriptionForm 스켈레톤 — 입력 필드 5개 */}
      <div className="space-y-5">
        {/* 서비스명 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 카테고리 선택 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 금액 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 결제 주기 선택 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 다음 결제일 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 제출 버튼 */}
        <Skeleton className="mt-2 h-10 w-full" />
      </div>
    </div>
  )
}
