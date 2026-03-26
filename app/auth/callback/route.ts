import { redirect } from "next/navigation"
import { type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

// OAuth 인증 코드를 세션으로 교환하는 콜백 라우트
// Google 등 OAuth 공급자 인증 완료 후 이 경로로 리다이렉트됨
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  // next 파라미터가 있으면 해당 경로로, 없으면 /dashboard로 이동
  const next = searchParams.get("next") ?? "/dashboard"

  if (!code) {
    redirect("/auth/error?error=No+code+provided")
  }

  const supabase = await createClient()

  // PKCE 흐름: OAuth 인증 코드를 세션 토큰으로 교환
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`)
  }

  // 세션 교환 성공 후 보호된 페이지로 이동
  redirect(next)
}
