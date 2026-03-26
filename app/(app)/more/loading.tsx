// Route: /more — 로딩 스켈레톤 UI
// 실제 레이아웃을 반영: 계정 섹션 + 테마 섹션 + 알림 설정 섹션 + 앱 정보 섹션
// Server Component — "use client" 불필요

// Skeleton 기본 블록 — animate-pulse + bg-muted 조합
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />
}

export default function MoreLoading() {
  return (
    <div className="space-y-4">
      {/* 계정 섹션 스켈레톤 */}
      <section>
        {/* 섹션 레이블 */}
        <Skeleton className="mb-2 h-4 w-8" />
        <div className="rounded-xl border bg-card p-4">
          {/* 계정 행 — 플랫폼 뱃지 + 이메일 + 로그아웃 버튼 */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-16" />
          </div>
          {/* 닉네임 설정 행 */}
          <div className="mt-3 flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
      </section>

      {/* 테마 설정 섹션 스켈레톤 */}
      <section>
        <Skeleton className="mb-2 h-4 w-8" />
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-12" />
            {/* ThemeSwitcher 버튼 그룹 */}
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </section>

      {/* 알림 설정 섹션 스켈레톤 */}
      <section>
        <Skeleton className="mb-2 h-4 w-16" />
        <div className="space-y-2 rounded-xl border bg-card p-4">
          {/* 알림 설정 항목 2개 — 레이블 + 토글 */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* 앱 정보 섹션 스켈레톤 */}
      <section>
        <Skeleton className="mb-2 h-4 w-12" />
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      </section>
    </div>
  )
}
