"use client"

// 알림 설정 섹션 — 결제일 알림 토글 + D-day 알림 시점 선택
// Web Push API(VAPID) + Supabase DB 연동으로 실제 푸시 알림 구독/해제 처리
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  getNotificationPreference,
  subscribePush,
  updateNotificationPreference,
} from "@/app/actions/push"
import { Switch } from "@/components/ui/switch"

// D-day 알림 시점 옵션 상수
const DDAY_OPTIONS = [
  { label: "당일", value: 0 },
  { label: "1일", value: 1 },
  { label: "3일", value: 3 },
  { label: "5일", value: 5 },
]

// VAPID 공개키 — 환경변수에서 주입
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""

// VAPID 공개키를 PushManager.subscribe()에 필요한 Uint8Array로 변환
// Base64URL → Uint8Array 디코딩
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationSettings() {
  // 결제일 알림 on/off
  const [enabled, setEnabled] = useState(false)
  // D-day 알림 시점 (기본값: 1일 전)
  const [selectedDday, setSelectedDday] = useState(1)
  // 서버 요청 중 중복 조작 방지
  const [loading, setLoading] = useState(false)
  // 초기 로딩 완료 여부 — 로딩 전에는 토글 비활성화
  const [initialized, setInitialized] = useState(false)

  // 마운트 시 DB에서 현재 알림 설정 로드
  useEffect(() => {
    async function loadPreference() {
      const pref = await getNotificationPreference()
      if (pref) {
        setEnabled(pref.enabled)
        setSelectedDday(pref.dday_offset)
      }
      setInitialized(true)
    }
    loadPreference()
  }, [])

  // 알림 토글 변경 핸들러
  async function handleToggle(checked: boolean) {
    setLoading(true)

    try {
      if (checked) {
        // 알림 ON: 브라우저 권한 요청 → SW 등록 → 푸시 구독 → DB 저장
        await enablePushNotification()
      } else {
        // 알림 OFF: DB만 업데이트 (SW/구독은 유지, 서버에서 발송 안 함)
        const result = await updateNotificationPreference(false, selectedDday)
        if (!result.success) {
          toast.error(result.error)
          return
        }
        setEnabled(false)
        toast.success("알림이 해제되었습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  // 푸시 알림 활성화 전체 플로우
  async function enablePushNotification() {
    // 1. 브라우저 알림 API 지원 확인
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast.error("이 브라우저는 알림을 지원하지 않습니다.")
      return
    }

    // 2. 알림 권한 요청
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      toast.error("알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.")
      return
    }

    // 3. Service Worker 등록
    const registration = await navigator.serviceWorker.register("/sw.js")
    // SW가 활성화될 때까지 대기
    await navigator.serviceWorker.ready

    // 4. PushManager로 VAPID 기반 푸시 구독 생성
    // applicationServerKey는 BufferSource 타입이 필요하므로 명시적 캐스팅
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })

    // 5. 구독 정보에서 endpoint, keys 추출
    const subscriptionJson = subscription.toJSON()
    const endpoint = subscriptionJson.endpoint
    const p256dh = subscriptionJson.keys?.p256dh
    const auth = subscriptionJson.keys?.auth

    if (!endpoint || !p256dh || !auth) {
      toast.error("푸시 구독 정보를 가져오지 못했습니다.")
      return
    }

    // 6. Server Action으로 DB에 저장
    const result = await subscribePush({ endpoint, keys: { p256dh, auth } }, selectedDday)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    setEnabled(true)
    toast.success("알림이 설정되었습니다.")
  }

  // D-day 변경 핸들러 — 활성화 상태일 때만 서버에 반영
  async function handleDdayChange(value: number) {
    setSelectedDday(value)

    if (!enabled) return

    setLoading(true)
    try {
      const result = await updateNotificationPreference(true, value)
      if (!result.success) {
        toast.error(result.error)
      } else {
        toast.success("알림 시점이 변경되었습니다.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <p className="mb-2 text-sm text-muted-foreground">알림설정</p>
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">
          결제일(만료일) 하루 전, 당일 알림을 보내드립니다.
        </p>

        {/* 결제일 알림 토글 — 초기 로딩 또는 요청 중에는 비활성화 */}
        <div className="flex items-center justify-between">
          <span className="text-sm">결제일 알림</span>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={!initialized || loading}
            aria-label="결제일 알림 토글"
          />
        </div>

        {/* D-day 알림 시점 선택 — 알림 활성화 시에만 표시 */}
        {enabled && (
          <div>
            <p className="mb-2 text-xs text-muted-foreground">D-day 알림 시점</p>
            <div className="flex gap-2">
              {DDAY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleDdayChange(opt.value)}
                  disabled={loading}
                  // 선택된 버튼은 primary 색상, 나머지는 기본 border
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
                    selectedDday === opt.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              * 결제일 당일 아침 9시에 알림을 받습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
