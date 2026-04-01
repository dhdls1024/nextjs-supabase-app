// Route: /more
// Features: 계정 정보, 테마 설정, 알림설정, 앱 정보, 로그아웃
import { Suspense } from "react"

import { LogoutButton } from "@/components/logout-button"
import { NicknameForm } from "@/components/nickname-form"
import NotificationSettings from "@/components/notification-settings"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { createClient } from "@/lib/supabase/server"

// 앱 버전 상수
const APP_VERSION = "1.0.0"

// provider 이름 → 표시 라벨 변환
function getProviderLabel(provider: string): string {
  const map: Record<string, string> = {
    google: "G",
    email: "E",
    github: "GH",
    kakao: "K",
  }
  return map[provider] ?? provider.slice(0, 2).toUpperCase()
}

// provider별 배지 색상
function getProviderColor(provider: string): { background: string; color: string } {
  const map: Record<string, { background: string; color: string }> = {
    google: { background: "#fff", color: "#444" },
    email: { background: "#4f46e5", color: "#fff" },
    github: { background: "#1f2937", color: "#fff" },
    kakao: { background: "#FEE500", color: "#1a1a1a" },
  }
  return map[provider] ?? { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
}

// 섹션 레이블 공통 스타일 컴포넌트
function SectionLabel({ label }: { label: string }) {
  return (
    <p
      className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider"
      style={{ color: "hsl(var(--muted-foreground))" }}
    >
      {label}
    </p>
  )
}

// 계정 정보 서버 컴포넌트
async function AccountSection() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // app_metadata.provider: "google" | "email" | "github" 등
  const provider = (user?.app_metadata?.provider as string) ?? "email"
  const nickname = (user?.user_metadata?.nickname as string) ?? ""
  const providerStyle = getProviderColor(provider)

  return (
    <section>
      <SectionLabel label="계정" />
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {/* 사용자 정보 행 */}
        <div className="flex items-center gap-3 px-4 py-4">
          {/* 플랫폼 배지 */}
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold"
            style={{ ...providerStyle, borderColor: "hsl(var(--border))" }}
          >
            {getProviderLabel(provider)}
          </span>
          <p className="flex-1 truncate text-sm" style={{ color: "hsl(var(--foreground))" }}>
            {user?.email}
          </p>
          <LogoutButton />
        </div>

        {/* 닉네임 설정 구분선 후 표시 */}
        <div className="border-t px-4 py-4" style={{ borderColor: "hsl(var(--border) / 0.6)" }}>
          <NicknameForm initialNickname={nickname} />
        </div>
      </div>
    </section>
  )
}

export default async function MorePage() {
  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
          더보기
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          계정 및 앱 설정
        </p>
      </div>

      {/* 계정 섹션 */}
      <Suspense
        fallback={
          <section>
            <SectionLabel label="계정" />
            <div className="h-[120px] animate-pulse rounded-2xl bg-muted" />
          </section>
        }
      >
        <AccountSection />
      </Suspense>

      {/* 화면 설정 섹션 */}
      <section>
        <SectionLabel label="화면" />
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium">테마</span>
            <ThemeSwitcher />
          </div>
        </div>
      </section>

      {/* 알림 설정 섹션 */}
      <NotificationSettings />

      {/* 앱 정보 섹션 */}
      <section>
        <SectionLabel label="앱 정보" />
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium">앱 버전</span>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
            >
              v{APP_VERSION}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
