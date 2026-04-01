// 구독 상태(SubscriptionStatus)를 시각적으로 표현하는 Badge 래퍼 컴포넌트
// ACTIVE: 초록, PAUSED: 노랑, CANCELLED: 회색

import type { SubscriptionStatus } from "@/lib/types/index"

// StatusBadge 컴포넌트 Props 타입
type StatusBadgeProps = {
  status: SubscriptionStatus
}

// 상태별 레이블 매핑 상수
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "활성",
  PAUSED: "일시정지",
  CANCELLED: "해지",
}

// 상태별 인라인 스타일 매핑 — CSS 변수와 무관하게 명확한 색상 보장
const STATUS_STYLE: Record<SubscriptionStatus, React.CSSProperties> = {
  ACTIVE: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#16a34a",
    border: "1px solid rgba(34, 197, 94, 0.25)",
  },
  PAUSED: {
    background: "rgba(234, 179, 8, 0.12)",
    color: "#ca8a04",
    border: "1px solid rgba(234, 179, 8, 0.25)",
  },
  CANCELLED: {
    background: "rgba(148, 163, 184, 0.12)",
    color: "#64748b",
    border: "1px solid rgba(148, 163, 184, 0.2)",
  },
}

// 구독 상태에 따라 색상과 레이블이 다른 Badge를 렌더링
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={STATUS_STYLE[status]}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
