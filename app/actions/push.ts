"use server"

// 푸시 알림 Server Actions
// push_subscriptions, notification_preferences 테이블 CRUD 처리
import { createClient } from "@/lib/supabase/server"
import type { NotificationPreference } from "@/lib/types/database"

import type { ActionResult } from "./types"

// 브라우저 PushSubscription에서 추출한 데이터 형태
interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

// 푸시 구독 등록 + 알림 설정 활성화
// 알림 토글 ON 시 호출: PushSubscription을 DB에 저장하고 preference를 enabled=true로 설정
export async function subscribePush(
  subscription: PushSubscriptionData,
  ddayOffset: number
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // push_subscriptions upsert — 동일 endpoint가 있으면 키만 갱신
  const { error: pushError } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      keys_p256dh: subscription.keys.p256dh,
      keys_auth: subscription.keys.auth,
    },
    { onConflict: "user_id,endpoint" }
  )

  if (pushError) {
    return { success: false, error: pushError.message }
  }

  // notification_preferences upsert — 1인 1행, enabled=true로 설정
  const { error: prefError } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      enabled: true,
      dday_offset: ddayOffset,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (prefError) {
    return { success: false, error: prefError.message }
  }

  return { success: true, data: undefined }
}

// 알림 설정 업데이트 (토글 OFF 또는 D-day 변경 시)
export async function updateNotificationPreference(
  enabled: boolean,
  ddayOffset: number
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "로그인이 필요합니다." }

  // upsert로 행이 없으면 생성, 있으면 업데이트
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: user.id,
      enabled,
      dday_offset: ddayOffset,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: undefined }
}

// 현재 사용자의 알림 설정 조회
export async function getNotificationPreference(): Promise<NotificationPreference | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error || !data) return null
  return data as NotificationPreference
}
