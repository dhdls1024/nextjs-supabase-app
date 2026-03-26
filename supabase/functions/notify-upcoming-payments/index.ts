// Supabase Edge Function: 결제 예정 구독 알림 발송
// pg_cron에 의해 매일 00:00 UTC (09:00 KST)에 호출됨
// npm:web-push 사용 (Deno NPM 호환)

import webpush from "npm:web-push@3.6.7"
import { createClient } from "npm:@supabase/supabase-js@2"

// 환경변수에서 필수 설정값 로드
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!
const VAPID_EMAIL = Deno.env.get("VAPID_EMAIL") ?? "mailto:admin@subtracker.app"

// VAPID 인증 설정 — webpush 라이브러리에 키 등록
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

// 알림 발송 결과 추적용 타입
interface SendResult {
  sent: number
  failed: number
  expiredSubscriptions: number
}

Deno.serve(async (req) => {
  try {
    // service_role 키로 RLS 우회하여 전체 사용자 데이터 조회
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. 알림이 활성화된 사용자 목록 조회
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("enabled", true)

    if (prefError) {
      return new Response(JSON.stringify({ error: prefError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ message: "알림 대상 사용자가 없습니다.", sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const result: SendResult = { sent: 0, failed: 0, expiredSubscriptions: 0 }

    // 2. 각 사용자별로 결제 예정 구독 확인 및 알림 발송
    for (const pref of preferences) {
      // dday_offset만큼 앞선 날짜의 구독을 조회
      // 예: dday_offset=1이면 내일 결제되는 구독에 대해 오늘 알림
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + pref.dday_offset)
      const targetDateStr = targetDate.toISOString().split("T")[0]

      // 해당 사용자의 결제 예정 구독 조회 (활성 상태만)
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("name, amount, next_billing_date")
        .eq("user_id", pref.user_id)
        .eq("status", "ACTIVE")
        .eq("next_billing_date", targetDateStr)

      // 결제 예정 구독이 없으면 스킵
      if (!subscriptions || subscriptions.length === 0) continue

      // 해당 사용자의 푸시 구독 목록 조회
      const { data: pushSubs } = await supabase
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", pref.user_id)

      if (!pushSubs || pushSubs.length === 0) continue

      // 알림 메시지 구성
      const ddayText = pref.dday_offset === 0 ? "오늘" : `${pref.dday_offset}일 후`
      const subNames = subscriptions.map((s) => s.name).join(", ")
      const totalAmount = subscriptions.reduce((sum, s) => sum + Number(s.amount), 0)

      const payload = JSON.stringify({
        title: `결제 예정 알림 (${ddayText})`,
        body: `${subNames} — 총 ${totalAmount.toLocaleString()}원`,
        tag: `billing-${targetDateStr}`,
        url: "/dashboard",
      })

      // 각 브라우저(디바이스)에 알림 발송
      for (const pushSub of pushSubs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: pushSub.endpoint,
              keys: {
                p256dh: pushSub.keys_p256dh,
                auth: pushSub.keys_auth,
              },
            },
            payload
          )
          result.sent++
        } catch (err: unknown) {
          result.failed++

          // 410 Gone 또는 404: 구독이 만료/해제됨 → DB에서 삭제
          const statusCode = (err as { statusCode?: number })?.statusCode
          if (statusCode === 410 || statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("id", pushSub.id)
            result.expiredSubscriptions++
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: "알림 발송 완료", ...result }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
