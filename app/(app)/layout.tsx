// Route Group (app) 레이아웃 - 인증된 사용자 전용 공통 레이아웃
// dashboard, subscriptions, groups, analytics 경로가 공유
// PC(md 이상): AppHeader(탑 네비) / 모바일(md 미만): MobileHeader + MobileTabBar
import { Suspense } from "react"

import AppHeader from "@/components/app-header"
import MobileHeader from "@/components/mobile-header"
import MobileTabBar from "@/components/mobile-tab-bar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* PC 전용 탑 네비 — app-header 내부에서 hidden md:block 처리 */}
      <AppHeader />
      {/* 모바일 전용 상단 헤더 — md 미만에서만 표시 */}
      <MobileHeader />
      {/* pb-20: 모바일 하단 탭바 높이(h-16)만큼 콘텐츠가 가려지지 않도록 패딩 확보 */}
      <main className="container mx-auto flex-1 px-4 py-6 pb-20 md:pb-6">{children}</main>
      {/* MobileTabBar는 usePathname()을 사용하므로 Suspense로 감싸야 정적 생성 시 오류 방지 */}
      {/* Next.js 16에서 usePathname()은 Suspense 경계 안에서만 안전하게 사용 가능 */}
      <Suspense>
        <MobileTabBar />
      </Suspense>
    </div>
  )
}
