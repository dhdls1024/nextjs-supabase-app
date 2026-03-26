// 구독 삭제 확인 다이얼로그 컴포넌트
// 삭제 전 사용자에게 확인을 받는 모달 UI
// shadcn/ui Dialog를 사용하여 구현
"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteSubscription } from "@/app/actions/subscription"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// DeleteSubscriptionDialog Props 타입
type DeleteSubscriptionDialogProps = {
  subscriptionId: string
  subscriptionName: string
}

// 구독 삭제 전 사용자 확인을 받는 다이얼로그
// DialogTrigger에 destructive 버튼을 연결하여 열기/닫기 제어
export function DeleteSubscriptionDialog({
  subscriptionId,
  subscriptionName,
}: DeleteSubscriptionDialogProps) {
  const router = useRouter()
  // useTransition: deleteSubscription Server Action 호출 중 pending 상태 관리
  const [isPending, startTransition] = useTransition()

  // 삭제 확인 핸들러 — deleteSubscription Server Action 호출
  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSubscription(subscriptionId)
      if (result.success) {
        toast.success("구독이 삭제되었습니다.")
        router.push("/dashboard")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog>
      {/* 삭제 버튼 — destructive 스타일로 위험 작업임을 시각적으로 표현 */}
      <DialogTrigger asChild>
        <Button variant="destructive">구독 삭제</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>구독을 삭제하시겠습니까?</DialogTitle>
          <DialogDescription>
            &quot;{subscriptionName}&quot; 구독을 삭제하면 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {/* 취소 버튼 — DialogClose로 다이얼로그만 닫음 */}
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              취소
            </Button>
          </DialogClose>

          {/* 삭제 확인 버튼 — isPending 중 비활성화 */}
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
