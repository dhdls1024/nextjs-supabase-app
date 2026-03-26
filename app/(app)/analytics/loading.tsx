// Route: /analytics — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: PageHeader + 총지출 카드 + 차트 영역 + 구분선 + 카테고리 테이블
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* PageHeader 스켈레톤 — 제목 + 설명 */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* 이번 달 총 지출 카드 스켈레톤 */}
      <div className="rounded-xl border bg-card p-4">
        <Skeleton className="mb-3 h-4 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* AnalyticsCharts 스켈레톤 — 차트 영역 (바 차트 모방) */}
      <div className="rounded-xl border bg-card p-4">
        {/* 차트 제목 영역 */}
        <Skeleton className="mb-4 h-5 w-32" />
        {/* 차트 본문 — 막대 그래프 형태 모방 (Tailwind 고정 높이 클래스 사용) */}
        {/* 인라인 style 대신 Tailwind 클래스로 다른 높이를 표현 */}
        <div className="flex h-48 items-end gap-3">
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-28 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-20 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-36 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-14 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-24 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-32 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <Skeleton className="h-20 w-full rounded-t" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div className="h-px w-full bg-border" />

      {/* 카테고리별 상세 테이블 스켈레톤 */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {/* 테이블 헤더 */}
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
        {/* 테이블 행 4개 */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
