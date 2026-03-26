// 구독 상태(SubscriptionStatus)를 시각적으로 표현하는 Badge 래퍼 컴포넌트
// ACTIVE: 초록, PAUSED: 노랑, CANCELLED: 회색

import { Badge } from "@/components/ui/badge"
import type { SubscriptionStatus } from "@/lib/types/index"

// StatusBadge 컴포넌트 Props 타입
type StatusBadgeProps = {
  status: SubscriptionStatus
}

// 상태별 레이블 매핑 상수 (매직스트링 방지)
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "활성",
  PAUSED: "일시정지",
  CANCELLED: "해지",
}

// 상태별 Tailwind 클래스 매핑 상수
const STATUS_CLASS: Record<SubscriptionStatus, string> = {
  ACTIVE: "border-transparent bg-green-100 text-green-800 hover:bg-green-100",
  PAUSED: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  CANCELLED: "",
}

// 상태별 variant 매핑 상수
const STATUS_VARIANT: Record<SubscriptionStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  PAUSED: "secondary",
  CANCELLED: "outline",
}

// 구독 상태에 따라 색상과 레이블이 다른 Badge를 렌더링
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
