// SubTracker 서비스 랜딩 페이지
// 공개 접근 가능한 정적 페이지로, 서비스 소개와 회원가입/로그인 CTA를 제공한다.
import Link from "next/link"

import { ThemeSwitcher } from "@/components/theme-switcher"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          {/* 로고 */}
          <Link href="/dashboard" className="text-lg font-bold">
            SubTracker
          </Link>

          {/* 우측 액션 영역 */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">로그인</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">시작하기</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <section className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <div className="mx-auto max-w-3xl px-4">
          {/* 메인 헤드라인 */}
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">구독 관리를 한 곳에서</h1>

          {/* 서브텍스트 */}
          <p className="mt-6 text-lg text-muted-foreground">
            흩어진 구독 서비스를 통합하고, 불필요한 지출을 방지하세요.
          </p>

          {/* CTA 버튼 그룹 */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">무료로 시작하기</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">로그인</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © 2025 SubTracker. 구독을 똑똑하게 관리하세요.
      </footer>
    </div>
  )
}
