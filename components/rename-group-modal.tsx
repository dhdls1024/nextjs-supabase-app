// 그룹 이름 수정 모달
// 그룹장만 사용 가능 — isOwner 조건은 호출부에서 처리
// renameGroup Server Action 호출 후 router.refresh()로 반영
"use client"

import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { renameGroup } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface RenameGroupModalProps {
  groupId: string
  currentName: string
  trigger?: React.ReactNode
}

export function RenameGroupModal({ groupId, currentName, trigger }: RenameGroupModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 모달 열릴 때 현재 이름으로 초기화
  function handleOpenChange(next: boolean) {
    if (next) setName(currentName)
    setOpen(next)
  }

  // renameGroup Server Action 호출
  function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) return

    startTransition(async () => {
      const result = await renameGroup(groupId, trimmed)
      if (result.success) {
        toast.success("그룹 이름이 수정되었습니다.")
        router.refresh()
        setOpen(false)
      } else {
        toast.error(result.error ?? "그룹 이름 수정에 실패했습니다.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="그룹 이름 수정">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>그룹 이름 수정</DialogTitle>
          <DialogDescription>새로운 그룹 이름을 입력하세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="group-name">그룹 이름</Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="그룹 이름을 입력하세요"
            maxLength={50}
            autoFocus
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || isPending}>
            {isPending ? "저장 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
