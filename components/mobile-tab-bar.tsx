"use client"

// 모바일 전용 하단 탭바 — 프리미엄 글래스모피즘 스타일
// usePathname으로 현재 경로 감지 → 활성 탭 하이라이트 + 광원 효과
import { BarChart2, LayoutList, MoreHorizontal, Plus, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// 탭 아이템 타입 정의
type TabItem = {
  href: string
  icon: React.ElementType
  label: string
  isFab?: boolean
}

// 탭 목록 상수
const MOBILE_TABS: TabItem[] = [
  { href: "/dashboard", icon: LayoutList, label: "구독" },
  { href: "/groups", icon: Users, label: "그룹" },
  // isFab: 중앙 강조 버튼 (구독 추가)
  { href: "/subscriptions/new", icon: Plus, label: "추가", isFab: true },
  { href: "/analytics", icon: BarChart2, label: "분석" },
  { href: "/more", icon: MoreHorizontal, label: "더보기" },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    // 하단 고정 탭바 — 글래스모피즘 + 상단 그라데이션 테두리
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* 블러 배경 레이어 */}
      <div
        className="absolute inset-0 backdrop-blur-xl"
        style={{
          background: "hsl(var(--background) / 0.85)",
          borderTop: "1px solid hsl(var(--border) / 0.6)",
        }}
      />
      {/* 상단 그라데이션 선 — 프리미엄 느낌 */}
      <div
        className="absolute left-0 right-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)",
        }}
      />

      <div className="relative mx-auto flex h-[68px] w-full max-w-md items-center px-2">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive =
            pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href))

          // FAB 스타일 중앙 추가 버튼 — 그라데이션 + 그림자
          if (tab.isFab) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center">
                {/* 살짝 위로 돌출 + 그라데이션 배경 */}
                <span
                  className="flex h-[52px] w-[52px] -translate-y-3 items-center justify-center rounded-2xl text-white shadow-lg transition-transform active:scale-95"
                  style={{
                    background: "var(--gradient-primary)",
                    boxShadow: "var(--glow-primary), 0 4px 16px rgba(0,0,0,0.25)",
                  }}
                >
                  <Icon size={22} strokeWidth={2.5} />
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* 활성 탭 배경 하이라이트 */}
              {isActive && (
                <span
                  className="absolute top-1.5 flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "hsl(var(--primary) / 0.12)" }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
