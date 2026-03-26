"use client"
// 초대 코드로 그룹에 참여하는 폼 컴포넌트
// 초대 코드 입력 후 참여 버튼 클릭 시 joinGroup Server Action 호출

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { joinGroup } from "@/app/actions/group"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function JoinGroupForm() {
  // 사용자가 입력한 초대 코드 상태
  const [code, setCode] = useState("")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 참여 버튼 클릭 핸들러 — joinGroup Server Action 호출
  const handleJoin = () => {
    if (!code.trim()) return

    startTransition(async () => {
      const result = await joinGroup(code.trim())
      if (result.success) {
        toast.success(`"${result.data.name}" 그룹에 참여했습니다.`)
        setCode("")
        router.refresh()
      } else {
        toast.error(result.error ?? "그룹 참여에 실패했습니다.")
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder="초대 코드 입력"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={isPending}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleJoin()
        }}
      />
      <Button onClick={handleJoin} disabled={isPending || !code.trim()}>
        {isPending ? "참여 중..." : "참여"}
      </Button>
    </div>
  )
}
