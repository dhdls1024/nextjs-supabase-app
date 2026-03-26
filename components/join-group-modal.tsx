"use client"
// 초대 코드로 그룹 참여하는 모달 컴포넌트
// CreateGroupModal과 동일한 Dialog 패턴 사용
// joinGroup Server Action 호출 후 router.refresh()로 목록 갱신

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { joinGroup } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// 그룹 참여 폼 내부 컴포넌트
function JoinGroupFormInner({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleJoin() {
    const trimmed = code.trim()
    if (!trimmed) {
      setError("초대 코드를 입력하세요.")
      return
    }

    startTransition(async () => {
      const result = await joinGroup(trimmed)
      if (result.success) {
        toast.success(`"${result.data.name}" 그룹에 참여했습니다.`)
        setCode("")
        setError("")
        router.refresh()
        onSuccess()
      } else {
        setError(result.error ?? "그룹 참여에 실패했습니다.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-code">초대 코드</Label>
        <Input
          id="invite-code"
          placeholder="초대 코드를 입력하세요"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError("")
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleJoin()
          }}
          disabled={isPending}
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isPending}>
          취소
        </Button>
        <Button onClick={handleJoin} disabled={isPending || !code.trim()}>
          {isPending ? "참여 중..." : "참여"}
        </Button>
      </div>
    </div>
  )
}

// 그룹 참여 버튼 + 다이얼로그 트리거 컴포넌트
export function JoinGroupModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">그룹 참여</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>그룹 참여</DialogTitle>
          <DialogDescription>초대 코드를 입력하여 그룹에 참여하세요.</DialogDescription>
        </DialogHeader>

        <JoinGroupFormInner onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
