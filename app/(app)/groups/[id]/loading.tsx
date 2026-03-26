// Route: /groups/[id] — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: PageHeader + GroupSubscriptionTable + MemberList + ReceiptSection
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function GroupDetailLoading() {
  return (
    <div className="space-y-8">
      {/* PageHeader 스켈레톤 — 그룹명 + 액션 버튼들 */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
        {/* 그룹장 전용 버튼 영역 */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-16" />
        </div>
      </div>

      {/* GroupSubscriptionTable 스켈레톤 — 구독 테이블 */}
      <div className="space-y-3">
        {/* 테이블 헤더 */}
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
        {/* 테이블 행 2개 */}
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-border" />

      {/* MemberList 스켈레톤 — 멤버 3행 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border px-4 py-2.5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-border" />

      {/* ReceiptSection 스켈레톤 — 영수증 영역 */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}
