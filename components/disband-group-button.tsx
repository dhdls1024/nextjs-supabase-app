// 그룹 해산 버튼 + 확인 다이얼로그 컴포넌트 — 그룹장 전용
// AlertDialog로 이중 확인 단계를 거쳐 실수로 인한 해산 방지
// disbandGroup Server Action 호출 후 /groups로 이동
"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { disbandGroup } from "@/app/actions/group"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

// DisbandGroupButton Props 타입 정의
interface DisbandGroupButtonProps {
  groupId: string
  groupName: string
}

// DisbandGroupButton: 그룹 해산 버튼 — AlertDialog로 이중 확인
// 확인 클릭 시 disbandGroup Server Action 호출 후 /groups로 이동
export function DisbandGroupButton({ groupId, groupName }: DisbandGroupButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 해산 확인 핸들러 — disbandGroup Server Action 호출
  function handleDisband() {
    startTransition(async () => {
      const result = await disbandGroup(groupId)
      if (result.success) {
        toast.success(`"${groupName}" 그룹이 해산되었습니다.`)
        router.push("/groups")
      } else {
        toast.error(result.error ?? "그룹 해산에 실패했습니다.")
      }
    })
  }

  return (
    <AlertDialog>
      {/* 트리거: destructive 스타일의 "그룹 해산" 버튼 */}
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isPending}>
          그룹 해산
        </Button>
      </AlertDialogTrigger>

      {/* 확인 다이얼로그 내용 */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>그룹을 해산하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            {/* 그룹명을 포함하여 어느 그룹을 해산하는지 명확히 안내 */}
            <strong>{groupName}</strong> 그룹을 해산하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {/* 취소 버튼 — 다이얼로그 닫기 */}
          <AlertDialogCancel>취소</AlertDialogCancel>

          {/* 확인 버튼 — destructive 스타일로 위험한 액션임을 시각적으로 강조 */}
          <AlertDialogAction
            onClick={handleDisband}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "해산 중..." : "해산"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
