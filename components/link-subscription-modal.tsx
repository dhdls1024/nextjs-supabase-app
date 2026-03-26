// 구독 연결 모달 컴포넌트 — 그룹장 전용
// 그룹에 기존 구독을 연결하고 분담 금액을 설정하는 Dialog
// react-hook-form + zod로 폼 유효성 검사 후 linkSubscription Server Action 호출
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { linkSubscription } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// 연결 가능한 구독 아이템 타입
interface AvailableSubscription {
  id: string
  name: string
  amount: number
}

// LinkSubscriptionModal Props 타입 정의
interface LinkSubscriptionModalProps {
  groupId: string
  availableSubscriptions: AvailableSubscription[]
  // 트리거 버튼을 외부에서 주입 — 재사용성을 높이기 위해 render props 패턴 사용
  trigger: React.ReactNode
}

// 폼 유효성 스키마 — 구독 선택만 검증 (분담금은 연결 후 별도 설정)
const linkSubscriptionSchema = z.object({
  subscription_id: z.string().min(1, "구독을 선택해주세요"),
})

// 폼 데이터 타입 — zod 스키마에서 추론
type LinkSubscriptionFormData = z.infer<typeof linkSubscriptionSchema>

// LinkSubscriptionModal: 구독 연결 폼 Dialog
// zodResolver로 react-hook-form과 zod 스키마를 연결
export function LinkSubscriptionModal({
  groupId,
  availableSubscriptions,
  trigger,
}: LinkSubscriptionModalProps) {
  // Dialog 열림/닫힘 상태 관리
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // react-hook-form 초기화 — zodResolver로 유효성 검사 연결
  const {
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LinkSubscriptionFormData>({
    resolver: zodResolver(linkSubscriptionSchema),
  })

  // 폼 제출 핸들러 — linkSubscription Server Action 호출 (분담금은 0으로 초기화, 이후 별도 설정)
  function onSubmit(data: LinkSubscriptionFormData) {
    startTransition(async () => {
      const result = await linkSubscription({
        group_id: groupId,
        subscription_id: data.subscription_id,
        split_amount: 0,
      })

      if (result.success) {
        toast.success("구독이 연결되었습니다.")
        reset()
        router.refresh()
        setOpen(false)
      } else {
        toast.error(result.error ?? "구독 연결에 실패했습니다.")
      }
    })
  }

  // Dialog 닫힐 때 폼 초기화
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) reset()
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* 외부에서 주입된 트리거 버튼 */}
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>구독 연결</DialogTitle>
          <DialogDescription>이 그룹에 연결할 구독 서비스를 선택하세요.</DialogDescription>
        </DialogHeader>

        {/* 구독 연결 폼 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 구독 선택 필드 */}
          <div className="space-y-2">
            <Label htmlFor="subscription_id">구독 서비스</Label>
            {/* Select는 react-hook-form의 register와 직접 연결이 어려워 setValue 사용 */}
            {/* shouldValidate: true — 선택 즉시 유효성 검사 트리거 */}
            <Select
              onValueChange={(value) =>
                setValue("subscription_id", value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="subscription_id" aria-describedby="subscription_id-error">
                <SelectValue placeholder="구독 서비스를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {availableSubscriptions.map((sub) => (
                  <SelectItem key={sub.id} value={sub.id}>
                    {/* 서비스명과 금액을 함께 표시 */}
                    {sub.name} ({sub.amount.toLocaleString()}원)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* 유효성 오류 메시지 */}
            {errors.subscription_id && (
              <p id="subscription_id-error" className="text-sm text-destructive" role="alert">
                {errors.subscription_id.message}
              </p>
            )}
          </div>

          {/* 액션 버튼 — 취소/연결 */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "연결 중..." : "연결"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
