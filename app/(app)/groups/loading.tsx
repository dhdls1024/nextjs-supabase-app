// Route: /groups — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: PageHeader(제목+버튼 2개) + 그룹 카드 목록(카드 2개)
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function GroupsLoading() {
  return (
    <div className="space-y-8">
      {/* PageHeader 스켈레톤 — 제목(좌) + 액션 버튼 2개(우) */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* 그룹 카드 스켈레톤 — 2개 세로 배열 (모바일 단일 컬럼) */}
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4">
            {/* 카드 헤더 — 아이콘 + 그룹명 */}
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>

            {/* 공유 구독 요약 행 */}
            <Skeleton className="mb-3 h-9 w-full rounded-md" />

            {/* 상세 보기 버튼 */}
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
