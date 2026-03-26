// Route: /dashboard — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: 헤더(제목+버튼), 카테고리 필터 탭, 요약 카드 2개, 구독 목록 행
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function DashboardLoading() {
  return (
    <div>
      {/* 페이지 헤더 스켈레톤 — 제목(좌) + 버튼(우) */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* 카테고리 필터 탭 스켈레톤 — 탭 5개 가로 배열 */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-16 shrink-0" />
        ))}
      </div>

      {/* 요약 카드 스켈레톤 — 2열 그리드 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            {/* 카드 제목 */}
            <Skeleton className="mb-3 h-4 w-16" />
            {/* 카드 수치 */}
            <Skeleton className="h-8 w-10" />
          </div>
        ))}
      </div>

      {/* 구독 목록 테이블 행 스켈레톤 — 5개 행 */}
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border bg-card px-4 py-3"
          >
            {/* 서비스명 영역 */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            {/* 금액 + 결제일 영역 */}
            <div className="space-y-1.5 text-right">
              <Skeleton className="ml-auto h-4 w-16" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
