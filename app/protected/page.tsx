import { InfoIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/lib/types/database"

// JWT claims를 JSON으로 출력하는 컴포넌트 (디버깅용)
async function UserClaims() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  return JSON.stringify(data.claims, null, 2)
}

// profiles 테이블에서 현재 사용자 프로필을 조회해 카드 형태로 표시
async function UserProfile() {
  const supabase = await createClient()

  // 현재 로그인한 사용자 조회
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // profiles 테이블에서 해당 사용자 프로필 단건 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>()

  // 미설정 필드를 표시하는 헬퍼 — null/undefined면 "미설정" 반환
  const display = (value: string | null | undefined) => value ?? "미설정"

  return (
    <div className="grid gap-3">
      <ProfileField label="이메일" value={user.email ?? "미설정"} />
      <ProfileField label="사용자명" value={display(profile?.username)} />
      <ProfileField label="이름" value={display(profile?.full_name)} />
      <ProfileField label="웹사이트" value={display(profile?.website)} />
      <ProfileField label="소개" value={display(profile?.bio)} />
      <ProfileField
        label="가입일"
        value={
          profile?.created_at ? new Date(profile.created_at).toLocaleDateString("ko-KR") : "미설정"
        }
      />
    </div>
  )
}

// 프로필 필드 1행을 렌더링하는 표시 전용 컴포넌트
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 border-b pb-2 last:border-0">
      <span className="w-24 shrink-0 text-sm font-medium text-muted-foreground">{label}</span>
      <span className="break-all text-sm">{value}</span>
    </div>
  )
}

export default function ProtectedPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12">
      {/* 인증된 사용자만 접근 가능하다는 안내 배너 */}
      <div className="w-full">
        <div className="flex items-center gap-3 rounded-md bg-accent p-3 px-5 text-sm text-foreground">
          <InfoIcon size="16" strokeWidth={2} />
          로그인한 사용자만 볼 수 있는 보호된 페이지입니다.
        </div>
      </div>

      {/* 프로필 정보 섹션 */}
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">내 프로필</h2>
        <div className="max-w-md rounded-lg border p-6">
          <Suspense fallback={<p className="text-sm text-muted-foreground">불러오는 중...</p>}>
            <UserProfile />
          </Suspense>
        </div>
      </div>

      {/* JWT Claims 디버깅 섹션 */}
      <div className="flex flex-col items-start gap-2">
        <h2 className="mb-4 text-2xl font-bold">JWT Claims</h2>
        <pre className="max-h-32 overflow-auto rounded border p-3 font-mono text-xs">
          <Suspense fallback="불러오는 중...">
            <UserClaims />
          </Suspense>
        </pre>
      </div>
    </div>
  )
}
