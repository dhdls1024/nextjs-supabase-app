"use server"

// 구독 Server Actions
// createClient는 매 요청마다 새로 생성 (Fluid compute 환경 대응)
import { revalidatePath, revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type {
  ServicePreset,
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
} from "@/lib/types/database"

import type { ActionResult } from "./types"

// billing_cycle에 따라 다음 결제일을 계산하는 유틸
// 월말 처리: 1월 31일 → 2월 28일처럼 해당 월의 마지막 날로 클램핑
function calcNextBillingDate(dateStr: string, cycle: "MONTHLY" | "YEARLY"): string {
  const date = new Date(dateStr)
  const day = date.getUTCDate()

  if (cycle === "MONTHLY") {
    // 다음 달의 같은 일수로 이동 (월말 초과 시 해당 월 마지막 날로 클램핑)
    const nextMonth = date.getUTCMonth() + 1
    const year = nextMonth === 12 ? date.getUTCFullYear() + 1 : date.getUTCFullYear()
    const month = nextMonth % 12
    const maxDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(Math.min(day, maxDay)).padStart(2, "0")}`
  } else {
    // 내년 같은 날짜로 이동 (2월 29일 → 윤년 아닌 경우 2월 28일로 클램핑)
    const nextYear = date.getUTCFullYear() + 1
    const month = date.getUTCMonth()
    const maxDay = new Date(Date.UTC(nextYear, month + 1, 0)).getUTCDate()
    return `${nextYear}-${String(month + 1).padStart(2, "0")}-${String(Math.min(day, maxDay)).padStart(2, "0")}`
  }
}

// 결제일이 지난 구독들의 next_billing_date를 다음 주기로 일괄 업데이트하는 Server Action
// 페이지 로드 시 호출 — revalidatePath가 유효한 Server Action 컨텍스트에서 실행되어야 캐시 무효화됨
export async function advanceOverdueBillingDates(userId: string): Promise<void> {
  const supabase = await createClient()

  // UTC+9(KST) 기준 오늘 날짜 문자열 (YYYY-MM-DD)
  const todayKST = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // 결제일이 오늘보다 과거인 활성 구독만 DB에서 조회
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, next_billing_date, billing_cycle")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .lt("next_billing_date", todayKST)

  if (error || !data || data.length === 0) return

  // 각 구독의 새 결제일 계산 (여러 주기 지난 경우 반복)
  const updates = data.map((s) => {
    let newDate = s.next_billing_date
    while (newDate < todayKST) {
      newDate = calcNextBillingDate(newDate, s.billing_cycle as "MONTHLY" | "YEARLY")
    }
    return { id: s.id, next_billing_date: newDate }
  })

  // 개별 update — RLS 환경에서 기존 행만 안전하게 갱신
  await Promise.all(
    updates.map((u) =>
      supabase
        .from("subscriptions")
        .update({ next_billing_date: u.next_billing_date })
        .eq("id", u.id)
    )
  )

  // Server Action 컨텍스트에서 호출되므로 revalidatePath가 정상 동작
  revalidatePath("/dashboard")
  revalidatePath("/subscriptions")
}

// 현재 로그인한 사용자의 구독 목록 조회
// Server Component에서 직접 호출 — 'use server' 불필요한 일반 async 함수이나
// 파일 레벨 'use server'로 인해 Server Actions로 동작
export async function getSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient()

  // 인증된 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("next_billing_date", { ascending: true })

  if (error) return []
  return (data ?? []) as Subscription[]
}

// userId를 직접 받아 getUser() 호출 생략 — 페이지에서 이미 인증 확인된 경우 사용
// 여러 Action을 병렬 호출할 때 getUser() 중복 호출을 방지하여 성능 최적화
export async function getSubscriptionsByUserId(userId: string): Promise<Subscription[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("next_billing_date", { ascending: true })

  if (error || !data) return []
  return data as Subscription[]
}

// 특정 구독 단건 조회
export async function getSubscription(id: string): Promise<Subscription | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // RLS 이중 보호
    .single()

  if (error || !data) return null
  return data as Subscription
}

// userId를 직접 받아 getUser() Auth 왕복을 생략하는 단건 조회
// 호출부에서 이미 인증 확인된 경우 사용 (성능 최적화)
export async function getSubscriptionById(
  id: string,
  userId: string
): Promise<Subscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (error || !data) return null
  return data as Subscription
}

// 구독 생성
export async function createSubscription(
  input: Omit<SubscriptionInsert, "user_id">
): Promise<ActionResult<Subscription>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ ...input, user_id: user.id })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? "구독 추가에 실패했습니다." }
  }

  // 대시보드, 분석 페이지 캐시 갱신
  revalidatePath("/dashboard")
  revalidatePath("/analytics")
  // unstable_cache 태그 무효화 — analytics 통계 캐시를 즉시 삭제하여 최신 데이터 반영
  revalidateTag(`analytics-${user.id}`)
  return { success: true, data: data as Subscription }
}

// 구독 수정
export async function updateSubscription(
  id: string,
  input: SubscriptionUpdate
): Promise<ActionResult<Subscription>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id) // RLS 이중 보호
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? "구독 수정에 실패했습니다." }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/subscriptions/${id}`)
  revalidatePath("/analytics")
  // unstable_cache 태그 무효화 — analytics 통계 캐시를 즉시 삭제하여 최신 데이터 반영
  revalidateTag(`analytics-${user.id}`)
  return { success: true, data: data as Subscription }
}

// 구독 삭제 — CASCADE로 DB receipts는 자동 삭제되지만
// Storage 영수증 파일은 별도로 정리해야 고아 파일이 남지 않음
export async function deleteSubscription(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // 삭제 전 영수증 파일 경로 조회 — CASCADE 전에 미리 조회
  const { data: receipts } = await supabase
    .from("receipts")
    .select("file_url")
    .eq("subscription_id", id)

  // Storage 영수증 파일 일괄 삭제 (파일이 있는 경우만)
  const filePaths = (receipts ?? []).map((r) => r.file_url).filter(Boolean)
  if (filePaths.length > 0) {
    await supabase.storage.from("receipts").remove(filePaths)
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id) // RLS 이중 보호

  if (error) {
    return { success: false, error: error.message ?? "구독 삭제에 실패했습니다." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/analytics")
  // unstable_cache 태그 무효화 — analytics 통계 캐시를 즉시 삭제하여 최신 데이터 반영
  revalidateTag(`analytics-${user.id}`)
  return { success: true, data: undefined }
}

// service_presets 전체 조회 — 인증 필요 (RLS)
// 전체 25개를 한 번에 조회하여 클라이언트에서 카테고리별 필터링
export async function getServicePresets(): Promise<ServicePreset[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("service_presets")
    .select("*")
    .order("category")
    .order("sort_order")

  if (error) return []
  return (data ?? []) as ServicePreset[]
}
