"use client"
// 그룹 생성 모달 컴포넌트
// Dialog를 열고 닫는 상태를 자체적으로 관리
// react-hook-form + zodResolver로 그룹명 유효성 검증 후 createGroup Server Action 호출

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { createGroup } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { groupSchema, type GroupFormData } from "@/lib/validations/group"

// 그룹 생성 폼 내부 컴포넌트 — 유효성 검증 로직 분리
function CreateGroupForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupFormData>({
    // zodResolver로 groupSchema 기반 유효성 검증
    resolver: zodResolver(groupSchema),
  })

  // 폼 제출 핸들러 — createGroup Server Action 호출
  const onSubmit = (data: GroupFormData) => {
    startTransition(async () => {
      const result = await createGroup(data.name)
      if (result.success) {
        toast.success("그룹이 생성되었습니다.")
        reset()
        router.refresh()
        onSuccess()
      } else {
        toast.error(result.error ?? "그룹 생성에 실패했습니다.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="group-name">그룹 이름</Label>
        <Input id="group-name" placeholder="그룹 이름을 입력하세요" {...register("name")} />
        {/* 유효성 오류 메시지 표시 */}
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
          취소
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "생성 중..." : "생성"}
        </Button>
      </div>
    </form>
  )
}

// 그룹 만들기 버튼 + 다이얼로그 트리거 컴포넌트
export function CreateGroupModal() {
  // 다이얼로그 열림/닫힘 상태 관리
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* 트리거 버튼 — 클릭 시 다이얼로그 열림 */}
      <DialogTrigger asChild>
        <Button>그룹 만들기</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 그룹 만들기</DialogTitle>
        </DialogHeader>

        {/* 폼 제출 성공 시 다이얼로그 닫기 */}
        <CreateGroupForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
