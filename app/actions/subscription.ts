"use server"

// 구독 Server Actions
// createClient는 매 요청마다 새로 생성 (Fluid compute 환경 대응)
import { revalidatePath, revalidateTag } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { ANALYTICS_CACHE_TTL } from "@/lib/types"
import type { Subscription, SubscriptionInsert, SubscriptionUpdate } from "@/lib/types/database"

import type { ActionResult } from "./types"

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
  revalidateTag(`analytics-${user.id}`, { expire: ANALYTICS_CACHE_TTL })
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
  revalidateTag(`analytics-${user.id}`, { expire: ANALYTICS_CACHE_TTL })
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
  revalidateTag(`analytics-${user.id}`, { expire: ANALYTICS_CACHE_TTL })
  return { success: true, data: undefined }
}
