// 페이지 상단 공통 헤더 컴포넌트
// 제목, 설명, 우측 액션 버튼 슬롯을 포함
// Server Component - children을 통한 액션 버튼 슬롯 지원

import type { ReactNode } from "react"

// PageHeader 컴포넌트 Props 타입
type PageHeaderProps = {
  title: string
  description?: string
  children?: ReactNode // 우측 액션 버튼 슬롯
}

// 제목(좌측)과 액션 버튼(우측)을 가로로 배치하는 페이지 헤더
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      {/* 제목과 설명 영역 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>

      {/* 우측 액션 버튼 슬롯 - 버튼, 드롭다운 등 배치 가능 */}
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
