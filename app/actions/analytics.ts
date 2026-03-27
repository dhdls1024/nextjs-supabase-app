"use server"

// 지출 분석 관련 Server Actions
// category_monthly_stats View 데이터 조회
// unstable_cache로 반복 방문 시 DB 쿼리를 생략하고 서버 캐시에서 반환

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"
import { cookies } from "next/headers"

import { createClient } from "@/lib/supabase/server"
import { ANALYTICS_CACHE_TTL } from "@/lib/types"
import type { Tables } from "@/lib/types/database"

// View Row 타입 추출
type CategoryMonthlyStat = Tables<"category_monthly_stats">

// unstable_cache 콜백 — 모듈 최상위에 정의하여 매 호출마다 함수 객체를 재생성하지 않음
// token과 userId를 인자로 받아 클로저 캡처 없이 캐시 직렬화 호환성 확보
const fetchCategoryStats = async (
  token: string,
  userId: string
): Promise<CategoryMonthlyStat[]> => {
  // unstable_cache 내부에서는 cookies() 호출이 금지되므로
  // 캐시 바깥에서 추출한 access token으로 직접 인증하는 클라이언트 생성
  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  )

  const { data, error } = await client
    .from("category_monthly_stats")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false })

  if (error || !data) return []
  return data
}

// 카테고리별 월 지출 통계 조회 (최신 월 기준)
// category_monthly_stats View: user_id + category + month 별 합계
export async function getCategoryMonthlyStats(): Promise<CategoryMonthlyStat[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  // 인증 확인 후 캐시된 함수로 위임
  return getCategoryMonthlyStatsByUserId(user.id)
}

// 쿠키에서 Supabase access token을 직접 읽는 헬퍼
// getSession() 대신 사용 — getSession()은 서버에서 토큰을 검증하지 않아 보안 위험
async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  // Supabase SSR은 sb-<project-ref>-auth-token 쿠키에 JSON 배열로 세션을 저장
  // 청크 분할된 경우 .0, .1 등 접미사가 붙음
  const allCookies = cookieStore.getAll()
  const authCookies = allCookies
    .filter((c) => c.name.includes("auth-token"))
    .sort((a, b) => a.name.localeCompare(b.name))

  if (authCookies.length === 0) return null

  try {
    // 청크 쿠키 값을 이어붙여 JSON 파싱
    const raw = authCookies.map((c) => c.value).join("")
    const parsed = JSON.parse(raw)
    // Supabase SSR 쿠키 형식: { access_token, refresh_token, ... }
    return parsed?.access_token ?? null
  } catch {
    return null
  }
}

// userId를 직접 받아 getUser() 호출 생략 — 페이지에서 이미 인증 확인된 경우 사용
// unstable_cache 적용: userId별 캐시 키 분리로 사용자 간 데이터 혼선 방지
// 구독 생성/수정/삭제 시 revalidateTag(`analytics-${userId}`)로 즉시 무효화
export async function getCategoryMonthlyStatsByUserId(
  userId: string
): Promise<CategoryMonthlyStat[]> {
  // 호출부에서 이미 getUser()로 인증 검증 완료된 상태
  // 쿠키에서 access token을 직접 읽어 캐시 함수에 전달 (getSession() 사용 안 함)
  const accessToken = await getAccessTokenFromCookies()
  if (!accessToken) return []

  // unstable_cache — 서버 캐시에 결과를 저장하고 TTL 또는 태그 무효화까지 재사용
  return unstable_cache(fetchCategoryStats, [`analytics-category-${userId}`], {
    revalidate: ANALYTICS_CACHE_TTL,
    // 태그 기반 무효화 — 구독 변경 시 revalidateTag로 즉시 캐시 삭제
    tags: [`analytics-${userId}`],
  })(accessToken, userId)
}
