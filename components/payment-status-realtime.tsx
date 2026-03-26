"use client"
// Supabase Realtime을 활용한 결제 상태 실시간 동기화 컴포넌트
// group_subscriptions 테이블 변경사항을 구독하여 다른 탭/기기에서도 즉각 반영
// 컴포넌트 언마운트 시 채널 구독 자동 해제

import { useEffect, useState } from "react"

import { createClient } from "@/lib/supabase/client"

// 연결 상태 타입
type ConnectionStatus = "connecting" | "connected" | "disconnected"

interface PaymentStatusRealtimeProps {
  groupId: string
  // 결제 상태 변경 시 호출 — 부모 컴포넌트가 데이터 갱신 방식 결정
  onStatusChange: (groupSubId: string, newStatus: "PENDING" | "PAID") => void
}

// PaymentStatusRealtime: group_subscriptions 테이블 Realtime 구독 컴포넌트
// 렌더링 없이 사이드 이펙트(채널 구독/해제)만 담당
// 연결 상태 인디케이터를 우측 하단에 표시
export function PaymentStatusRealtime({ groupId, onStatusChange }: PaymentStatusRealtimeProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting")

  useEffect(() => {
    // Supabase 브라우저 클라이언트 생성
    const supabase = createClient()

    // group_subscriptions 테이블의 특정 그룹 변경 이벤트 구독
    // filter: group_id = groupId 조건으로 해당 그룹의 변경만 수신
    const channel = supabase
      .channel(`group-payment-status-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "group_subscriptions",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          // 변경된 레코드의 결제 상태를 부모 컴포넌트에 전달
          const updated = payload.new as { id: string; payment_status: "PENDING" | "PAID" }
          if (updated.id && updated.payment_status) {
            onStatusChange(updated.id, updated.payment_status)
          }
        }
      )
      .subscribe((status) => {
        // 채널 연결 상태에 따라 인디케이터 업데이트
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected")
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setConnectionStatus("disconnected")
        } else {
          setConnectionStatus("connecting")
        }
      })

    // 컴포넌트 언마운트 시 채널 구독 해제 — 메모리 누수 방지
    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId, onStatusChange])

  // 연결 상태 인디케이터 색상 결정
  const indicatorColor = {
    connecting: "bg-yellow-400",
    connected: "bg-green-500",
    disconnected: "bg-red-500",
  }[connectionStatus]

  // 연결 상태 레이블
  const indicatorLabel = {
    connecting: "연결 중",
    connected: "실시간 연결됨",
    disconnected: "연결 끊김",
  }[connectionStatus]

  return (
    // 우측 하단 고정 인디케이터 — 실시간 연결 상태 표시
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-live="polite"
      aria-label={`실시간 상태: ${indicatorLabel}`}
    >
      <span className={`h-2 w-2 rounded-full ${indicatorColor}`} aria-hidden="true" />
      <span className="text-xs text-muted-foreground">{indicatorLabel}</span>
    </div>
  )
}
