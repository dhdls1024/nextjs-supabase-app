"use client"
// 그룹 페이지의 Realtime 동기화 래퍼 컴포넌트
// PaymentStatusRealtime(결제 상태)과 group_members 변경을 함께 구독
// 변경 감지 시 router.refresh()로 서버 데이터 갱신

import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

import { PaymentStatusRealtime } from "@/components/payment-status-realtime"
import { createClient } from "@/lib/supabase/client"

interface GroupRealtimeSyncProps {
  groupId: string
  // 현재 그룹에 연결된 구독 ID 목록 — receipts 채널 필터링에 사용
  subscriptionIds: string[]
}

// GroupRealtimeSync: 그룹 상세 페이지에 삽입하여 변경 사항을 실시간 감지
// - group_subscriptions: 결제 상태 변경 (PaymentStatusRealtime)
// - group_members: 멤버 추가/퇴출 (직접 구독)
// 변경 감지 시 router.refresh()로 Server Component 데이터를 재조회
export function GroupRealtimeSync({ groupId, subscriptionIds }: GroupRealtimeSyncProps) {
  const router = useRouter()

  // 결제 상태 변경 시 페이지 데이터 갱신
  // useCallback으로 메모이제이션 — PaymentStatusRealtime의 useEffect 재실행 방지
  const handleStatusChange = useCallback(() => {
    router.refresh()
  }, [router])

  // group_members 테이블 변경 구독 — 멤버 추가/퇴출 시 페이지 갱신
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`group-members-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT(참여), DELETE(퇴출) 모두 감지
          schema: "public",
          table: "group_members",
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, router])

  // receipts 테이블 변경 구독 — 영수증 업로드/삭제 시 페이지 갱신
  // receipts에는 group_id 컬럼이 없으므로 subscription_id IN 필터로 현재 그룹 범위만 구독
  // subscriptionIds가 비어있으면 구독 대상이 없으므로 채널을 생성하지 않음
  useEffect(() => {
    if (subscriptionIds.length === 0) return

    const supabase = createClient()

    const channel = supabase
      .channel(`receipts-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT(업로드), DELETE(삭제) 모두 감지
          schema: "public",
          table: "receipts",
          // Supabase Realtime in 필터 — 현재 그룹의 구독 ID만 감지
          filter: `subscription_id=in.(${subscriptionIds.join(",")})`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, subscriptionIds, router])

  return (
    <div className="flex items-center justify-end">
      {/* 실시간 연결 상태 인디케이터 */}
      <PaymentStatusRealtime groupId={groupId} onStatusChange={handleStatusChange} />
    </div>
  )
}
