// 모바일 전용 상단 헤더 (md 미만에서만 표시)
// ThemeSwitcher가 'use client'이므로 클라이언트 컴포넌트 유지
"use client"

import Link from "next/link"

import { ThemeSwitcher } from "@/components/theme-switcher"

export default function MobileHeader() {
  return (
    // block md:hidden — 모바일에서만 표시, PC에서는 숨김
    <header className="block border-b bg-background md:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        {/* 로고 — 대시보드로 이동 */}
        <Link href="/dashboard" className="text-base font-bold">
          SubTracker
        </Link>
        {/* 우측: 테마 전환 (로그아웃은 더보기 탭으로 이동) */}
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  )
}
