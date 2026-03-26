// Next.js 프록시 진입점 (구 middleware.ts)
// 모든 요청에 대해 Supabase 세션을 갱신하고 인증 상태를 확인한다
import { type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/proxy"

export async function proxy(request: NextRequest) {
  // lib/supabase/proxy.ts의 updateSession이 쿠키 갱신 및 인증 리다이렉트를 처리한다
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 미들웨어 적용:
     * - _next/static  : Next.js 정적 에셋
     * - _next/image   : Next.js 이미지 최적화 API
     * - favicon.ico   : 파비콘
     * - auth/confirm  : 이메일 OTP 확인 라우트 (인증 전 접근 필요)
     * - manifest.json, sw.js, icon-*.png, apple-touch-icon.png : PWA 정적 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|auth/confirm|manifest\\.json|sw\\.js|icon-.*\\.png|apple-touch-icon\\.png).*)",
  ],
}
