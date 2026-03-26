"use client"

// 모바일 전용 하단 탭바 (md 미만에서만 표시)
// usePathname으로 현재 경로 감지 → 활성 탭 하이라이트
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

// 탭 목록 상수 — 매직넘버 방지
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
    // fixed bottom-0 — 화면 하단에 고정, z-50으로 콘텐츠 위에 표시
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex h-16 w-full max-w-md items-center">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = pathname === tab.href

          // FAB 스타일 (중앙 추가 버튼)
          if (tab.isFab) {
            return (
              <Link key={tab.href} href={tab.href} className="flex flex-1 flex-col items-center">
                {/* -translate-y-2로 살짝 위로 돌출 */}
                <span className="flex h-12 w-12 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon size={22} />
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
