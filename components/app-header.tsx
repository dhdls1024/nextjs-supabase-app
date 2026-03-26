// SubTracker 앱 전용 탑 네비게이션 헤더
// Server Component - Link는 서버에서 사용 가능, use client 불필요
import Link from "next/link"

import { LogoutButton } from "@/components/logout-button"
import { ThemeSwitcher } from "@/components/theme-switcher"

// 네비게이션 링크 목록 (매직넘버 방지용 상수 정의)
const NAV_LINKS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/groups", label: "공유 그룹" },
  { href: "/analytics", label: "지출 분석" },
]

export default function AppHeader() {
  return (
    <header className="hidden border-b bg-background md:block">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* 로고 영역 */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            SubTracker
          </Link>
          {/* 네비게이션 링크 - 모바일에서는 숨기고 sm 이상에서 표시 */}
          <nav className="hidden items-center gap-4 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
