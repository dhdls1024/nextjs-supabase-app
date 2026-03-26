"use server"

// 지출 분석 관련 Server Actions
// category_monthly_stats, monthly_trend_stats View 데이터 조회

import { createClient } from "@/lib/supabase/server"
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

  const { data, error } = await supabase
    .from("category_monthly_stats")
    .select("*")
    .eq("user_id", user.id)
    .order("month", { ascending: false })

  if (error || !data) return []
  return data
}

// userId를 직접 받아 getUser() 호출 생략 — 페이지에서 이미 인증 확인된 경우 사용
// 여러 Action을 병렬 호출할 때 getUser() 중복 호출을 방지하여 성능 최적화
export async function getCategoryMonthlyStatsByUserId(
  userId: string
): Promise<CategoryMonthlyStat[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("category_monthly_stats")
    .select("*")
    .eq("user_id", userId)
    .order("month", { ascending: false })

  if (error || !data) return []
  return data
}
