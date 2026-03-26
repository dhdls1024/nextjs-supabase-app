// Route: /subscriptions/[id] — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: PageHeader + SubscriptionEditForm(필드 4개) + ReceiptSection
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function SubscriptionDetailLoading() {
  return (
    <div className="space-y-8">
      {/* PageHeader 스켈레톤 — 서비스명 + 설명 */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* SubscriptionEditForm 스켈레톤 — 수정 폼 필드 4개 */}
      <div className="space-y-5">
        {/* 서비스명 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 금액 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 결제 주기 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 다음 결제일 필드 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* 저장 버튼 */}
        <Skeleton className="mt-2 h-10 w-full" />
      </div>

      {/* ReceiptSection 스켈레톤 — 영수증 영역 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {/* 영수증 업로드 박스 */}
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}
