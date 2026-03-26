// 결제 상태 셀 컴포넌트
// 그룹 구독의 최종 결제 상태(PAID/PENDING)를 표시
// 그룹장(isOwner=true): 클릭으로 상태 토글 가능 (updateGroupSubscription 호출)
// 멤버(isOwner=false): 읽기 전용 Badge (클릭 불가)
"use client"

import { useRouter } from "next/navigation"
import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"

import { updateGroupSubscription } from "@/app/actions/group"
import { Badge } from "@/components/ui/badge"

// 결제 상태 타입
type PaymentStatus = "PENDING" | "PAID"

// PaymentStatusCell Props 타입 정의
interface PaymentStatusCellProps {
  groupSubId: string
  groupId: string
  currentStatus: PaymentStatus
  // 그룹장 여부 — true: 토글 가능, false: 읽기 전용
  isOwner: boolean
}

// PaymentStatusCell: 역할에 따라 다른 UI 렌더링
// 그룹장: 클릭 가능 버튼 형태의 Badge (useOptimistic으로 즉각 반영)
// 멤버: 읽기 전용 정적 Badge
export function PaymentStatusCell({
  groupSubId,
  groupId,
  currentStatus,
  isOwner,
}: PaymentStatusCellProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // useOptimistic: 서버 응답 전에 낙관적으로 UI 업데이트
  const [optimisticStatus, setOptimisticStatus] = useOptimistic<PaymentStatus>(currentStatus)

  // 상태 토글 핸들러 — 그룹장만 호출 가능
  // updateGroupSubscription Server Action으로 상태 변경
  function handleToggle() {
    const newStatus: PaymentStatus = optimisticStatus === "PAID" ? "PENDING" : "PAID"

    startTransition(async () => {
      // 낙관적 UI 업데이트 — 서버 응답 전에 즉각 반영
      setOptimisticStatus(newStatus)

      const result = await updateGroupSubscription(groupSubId, groupId, {
        payment_status: newStatus,
      })

      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error ?? "상태 변경에 실패했습니다.")
        // 실패 시 낙관적 업데이트는 자동으로 currentStatus로 복원됨
      }
    })
  }

  // 상태 Badge — PAID: 초록, PENDING: outline
  const badge =
    optimisticStatus === "PAID" ? (
      <Badge className="bg-green-600 hover:bg-green-600">납부완료</Badge>
    ) : (
      <Badge variant="outline">미납</Badge>
    )

  // 그룹장: 클릭 가능한 버튼으로 감싸서 토글 가능
  if (isOwner) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className="rounded-full transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`결제 상태: ${optimisticStatus === "PAID" ? "납부완료" : "미납"}. 클릭하여 변경`}
      >
        {badge}
      </button>
    )
  }

  // 멤버: 읽기 전용 — 클릭 불가, cursor-default
  return (
    <span
      aria-label={`결제 상태: ${optimisticStatus === "PAID" ? "납부완료" : "미납"} (변경 불가)`}
    >
      {badge}
    </span>
  )
}
