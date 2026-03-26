// Route Group (app) 레이아웃 - 인증된 사용자 전용 공통 레이아웃
// 헤더 없음 — 모바일 하단 탭바(MobileTabBar)로만 네비게이션
// max-w-md로 모바일 너비 고정 (PWA 모바일 전용 앱)
import { Suspense } from "react"

import MobileTabBar from "@/components/mobile-tab-bar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* max-w-md: 모바일 너비(448px) 고정, mx-auto: 데스크탑에서 중앙 정렬 */}
      {/* pb-20: 모바일 하단 탭바 높이(h-16)만큼 콘텐츠가 가려지지 않도록 패딩 확보 */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 pb-20">{children}</main>
      {/* MobileTabBar는 usePathname()을 사용하므로 Suspense로 감싸야 정적 생성 시 오류 방지 */}
      <Suspense>
        <MobileTabBar />
      </Suspense>
    </div>
  )
}
