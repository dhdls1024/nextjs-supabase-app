// Route: /more
// Features: 계정 정보, 알림설정, 앱 정보, 로그아웃
import { Suspense } from "react"

import { LogoutButton } from "@/components/logout-button"
import { NicknameForm } from "@/components/nickname-form"
import NotificationSettings from "@/components/notification-settings"
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
function getProviderColor(provider: string): string {
  const map: Record<string, string> = {
    google: "bg-white text-gray-700 border border-gray-200",
    email: "bg-blue-500 text-white",
    github: "bg-gray-800 text-white",
    kakao: "bg-yellow-400 text-gray-900",
  }
  return map[provider] ?? "bg-muted text-muted-foreground"
}

// 계정 정보 서버 컴포넌트 — Suspense 경계 안에서 렌더링하여 Uncached data 오류 방지
// Supabase createClient()가 캐시되지 않은 데이터에 접근하므로 Suspense로 감싸야 함
async function AccountSection() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // app_metadata.provider: "google" | "email" | "github" 등
  const provider = (user?.app_metadata?.provider as string) ?? "email"
  const nickname = (user?.user_metadata?.nickname as string) ?? ""

  return (
    <section>
      <p className="mb-2 text-sm text-muted-foreground">계정</p>
      <div className="rounded-xl border bg-card p-4">
        {/* 플랫폼 | 이메일 | 로그아웃 */}
        <div className="flex items-center gap-3">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getProviderColor(provider)}`}
            title={provider}
          >
            {getProviderLabel(provider)}
          </span>
          <p className="flex-1 truncate text-sm">{user?.email}</p>
          <LogoutButton />
        </div>

        {/* 닉네임 설정 — 인라인 편집 */}
        <NicknameForm initialNickname={nickname} />
      </div>
    </section>
  )
}

export default async function MorePage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      {/* 계정 섹션 — Suspense로 감싸서 Supabase 비동기 호출 격리 */}
      <Suspense
        fallback={
          <section>
            <p className="mb-2 text-sm text-muted-foreground">계정</p>
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            </div>
          </section>
        }
      >
        <AccountSection />
      </Suspense>

      {/* 알림설정 섹션 — 상태 관리가 필요해 Client Component로 분리 */}
      <NotificationSettings />

      {/* 앱 정보 섹션 */}
      <section>
        <p className="mb-2 text-sm text-muted-foreground">앱 정보</p>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">앱 버전</span>
            <span className="text-sm text-muted-foreground">{APP_VERSION}</span>
          </div>
        </div>
      </section>
    </div>
  )
}
