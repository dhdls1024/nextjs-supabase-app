"use server"

// 지출 분석 관련 Server Actions
// category_monthly_stats View 데이터 조회
// unstable_cache로 반복 방문 시 DB 쿼리를 생략하고 서버 캐시에서 반환

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { unstable_cache } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { ANALYTICS_CACHE_TTL } from "@/lib/types"
import type { Tables } from "@/lib/types/database"

// View Row 타입 추출
type CategoryMonthlyStat = Tables<"category_monthly_stats">

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

// userId를 직접 받아 getUser() 호출 생략 — 페이지에서 이미 인증 확인된 경우 사용
// unstable_cache 적용: userId별 캐시 키 분리로 사용자 간 데이터 혼선 방지
// 구독 생성/수정/삭제 시 revalidateTag(`analytics-${userId}`)로 즉시 무효화
export async function getCategoryMonthlyStatsByUserId(
  userId: string
): Promise<CategoryMonthlyStat[]> {
  // unstable_cache 내부에서 cookies()를 호출할 수 없으므로
  // 캐시 바깥에서 access token을 추출한 뒤 캐시 함수에 인자로 전달
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const accessToken = session?.access_token
  if (!accessToken) return []

  // unstable_cache — Next.js 서버 캐시에 결과를 저장하고 TTL 또는 태그 무효화까지 재사용
  // access token을 인자로 받아 캐시 함수 내부에서 쿠키 없이 Supabase 클라이언트 생성
  return unstable_cache(
    async (token: string) => {
      // 쿠키 기반 클라이언트 대신 access token으로 직접 인증하는 클라이언트 생성
      // unstable_cache 내부에서는 cookies()가 금지되므로 이 방식을 사용
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
    },
    // 캐시 키 — 사용자별로 분리하여 다른 사용자 데이터가 섞이지 않도록 함
    [`analytics-category-${userId}`],
    {
      revalidate: ANALYTICS_CACHE_TTL,
      // 태그 기반 무효화 — 구독 변경 시 revalidateTag로 즉시 캐시 삭제
      tags: [`analytics-${userId}`],
    }
  )(accessToken)
}
