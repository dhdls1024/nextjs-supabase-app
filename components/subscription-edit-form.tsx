// 구독 수정 폼 컴포넌트
// 기존 구독 데이터를 defaultValues로 받아 폼에 채워줌
// react-hook-form + zod 유효성 검증, shadcn/ui로 UI 구성
// Controller를 통해 Select 컴포넌트를 react-hook-form과 연결
"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type { z } from "zod"

import { updateSubscription } from "@/app/actions/subscription"
import { DeleteSubscriptionDialog } from "@/components/delete-subscription-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Subscription } from "@/lib/types/database"
import { BILLING_CYCLES, CATEGORIES, SUBSCRIPTION_STATUSES } from "@/lib/types/index"
import { subscriptionSchema } from "@/lib/validations/subscription"

// z.input: 폼 입력 타입 (status optional — zod default 때문)
// z.output: 폼 제출 타입 (status required — zod default 적용 후)
type SubscriptionFormInput = z.input<typeof subscriptionSchema>
type SubscriptionFormOutput = z.output<typeof subscriptionSchema>

// SubscriptionEditForm Props 타입
type SubscriptionEditFormProps = {
  subscription: Subscription
}

// 필드 에러 메시지 컴포넌트 — 각 필드 아래에 오류 표시
function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-sm text-destructive">{message}</p>
}

// SubscriptionEditForm: 구독 수정 폼
// subscription prop에서 defaultValues를 채워 기존 데이터를 수정할 수 있게 함
export function SubscriptionEditForm({ subscription }: SubscriptionEditFormProps) {
  const router = useRouter()
  // useTransition: Server Action 호출 중 pending 상태 관리
  const [isPending, startTransition] = useTransition()

  // zodResolver로 subscriptionSchema 연결
  // defaultValues에 기존 구독 데이터를 채워 폼 초기화
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SubscriptionFormInput, unknown, SubscriptionFormOutput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: subscription.name,
      category: subscription.category,
      amount: subscription.amount,
      billing_cycle: subscription.billing_cycle,
      next_billing_date: subscription.next_billing_date,
      status: subscription.status,
      logo_url: subscription.logo_url ?? "",
      notes: subscription.notes ?? "",
    },
  })

  // 폼 제출 핸들러 — updateSubscription Server Action 호출
  function onSubmit(data: SubscriptionFormOutput) {
    startTransition(async () => {
      const result = await updateSubscription(subscription.id, data)
      if (result.success) {
        toast.success("구독이 수정되었습니다.")
        router.push("/dashboard")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* 서비스명 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">서비스명</Label>
        <Input id="name" placeholder="예) Netflix" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      {/* 카테고리 — Select는 controlled 방식 필요하므로 Controller 사용 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">카테고리</Label>
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full" id="category">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.category?.message} />
      </div>

      {/* 금액 — valueAsNumber로 숫자 타입 변환 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">금액(원)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="예) 13900"
          className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          {...register("amount", { valueAsNumber: true })}
        />
        <FieldError message={errors.amount?.message} />
      </div>

      {/* 결제 주기 — Controller로 Select 연결 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="billing_cycle">결제 주기</Label>
        <Controller
          control={control}
          name="billing_cycle"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full" id="billing_cycle">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {BILLING_CYCLES.map((cycle) => (
                  <SelectItem key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.billing_cycle?.message} />
      </div>

      {/* 다음 결제일 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="next_billing_date">다음 결제일</Label>
        <Input id="next_billing_date" type="date" {...register("next_billing_date")} />
        <FieldError message={errors.next_billing_date?.message} />
      </div>

      {/* 상태 — Controller로 Select 연결 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="status">상태</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger className="w-full" id="status">
                <SelectValue placeholder="선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={errors.status?.message} />
      </div>

      {/* 메모 — 2열 전체 차지 */}
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label htmlFor="notes">메모</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="메모를 입력하세요 (선택)"
          className="flex w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          {...register("notes")}
        />
        <FieldError message={errors.notes?.message} />
      </div>

      {/* 버튼 영역 — 저장/취소는 좌측, 삭제는 우측에 배치 */}
      <div className="flex items-center justify-between gap-2 md:col-span-2">
        {/* 좌측: 저장 및 취소 버튼 — isPending 중 비활성화 */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "저장 중..." : "저장"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            취소
          </Button>
        </div>

        {/* 우측: 삭제 다이얼로그 트리거 — 구독 ID와 이름 전달 */}
        <DeleteSubscriptionDialog
          subscriptionId={subscription.id}
          subscriptionName={subscription.name}
        />
      </div>
    </form>
  )
}
