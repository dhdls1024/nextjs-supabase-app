// 결제 임박 여부를 표시하는 Badge 컴포넌트
// next_billing_date와 오늘 날짜 차이가 3일 이내이면 빨간 Badge를 표시
// Server Component - 순수 날짜 계산 로직만 포함

import { Badge } from "@/components/ui/badge"

// UrgentBadge 컴포넌트 Props 타입
type UrgentBadgeProps = {
  next_billing_date: string // YYYY-MM-DD 형식 날짜 문자열
}

// 결제 임박 판단 기준 일수 상수
const URGENT_DAYS_THRESHOLD = 3

// 두 날짜 간의 차이를 일(day) 단위로 계산
function getDaysDiff(targetDateStr: string): number {
  const today = new Date()
  // 시간대 오차를 없애기 위해 자정(UTC)으로 정규화
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(targetDateStr)
  targetDate.setHours(0, 0, 0, 0)
  const diffMs = targetDate.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// 결제일이 3일 이내이면 "N일 후 결제" Badge 반환, 초과이면 null 반환
export function UrgentBadge({ next_billing_date }: UrgentBadgeProps) {
  const daysLeft = getDaysDiff(next_billing_date)

  // 3일 초과이거나 이미 지난 경우 표시하지 않음
  if (daysLeft > URGENT_DAYS_THRESHOLD) return null

  // 오늘 결제인 경우와 N일 후인 경우 구분
  const label = daysLeft === 0 ? "오늘 결제" : `${daysLeft}일 후 결제`

  return (
    <Badge className="border-transparent bg-red-100 text-red-800 hover:bg-red-100">{label}</Badge>
  )
}
