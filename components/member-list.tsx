// 그룹 멤버 목록 + 정산금 + 정산 현황 통합 컴포넌트
//
// 정산금 표시 규칙:
//   - 그룹장: 전체 멤버 금액 표시 + Pencil 버튼으로 인라인 수정
//   - 멤버(본인): 본인 금액만 표시
//   - 멤버(타인): 금액 숨김 ("-")
//
// 정산 상태 규칙:
//   - 본인 또는 그룹장: 체크박스로 토글
//   - 타인 일반멤버: 읽기 전용 아이콘
"use client"

import { Check, CheckCircle2, Pencil, Trash2, X, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { kickMember, updateGroupSubscription } from "@/app/actions/group"
import { AmountDisplay } from "@/components/amount-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// 멤버 항목 타입
interface MemberItem {
  id: string
  user_id: string
  role: "OWNER" | "MEMBER"
  // 닉네임 우선, 없으면 이메일, 없으면 user_id
  displayName: string
}

// 정산 상태 타입
type SettlementStatus = "PENDING" | "PAID"

// MemberList Props
interface MemberListProps {
  members: MemberItem[]
  isOwner: boolean
  currentUserId: string
  // 그룹 ID — kickMember 호출에 필요
  groupId: string
  // 공유 구독 ID — 없으면 정산 컬럼 전체 숨김
  groupSubId?: string
  // 총 금액 — 균등 분할 초기값 계산용
  totalAmount?: number
  // DB에서 읽은 멤버별 정산금 초기값
  initialSplitAmounts?: Record<string, number>
  // DB에서 읽은 멤버별 납부 상태 초기값
  initialPaymentStatuses?: Record<string, SettlementStatus>
}

// 균등 분할 초기값 계산 — 나머지 원은 첫 번째 멤버에게 배분
function calcInitialSplits(members: MemberItem[], totalAmount: number): Record<string, number> {
  if (members.length === 0) return {}
  const base = Math.floor(totalAmount / members.length)
  const remainder = totalAmount - base * members.length
  return Object.fromEntries(members.map((m, i) => [m.user_id, i === 0 ? base + remainder : base]))
}

export function MemberList({
  members,
  isOwner,
  currentUserId,
  groupId,
  groupSubId,
  totalAmount,
  initialSplitAmounts,
  initialPaymentStatuses,
}: MemberListProps) {
  const router = useRouter()
  // useTransition: Server Action 호출 동안 pending 상태 관리
  const [isPending, startTransition] = useTransition()

  // 멤버별 정산금: Record<userId, number>
  // 우선순위: DB 초기값 → totalAmount 균등 분할 → 빈 객체
  const [splitAmounts, setSplitAmounts] = useState<Record<string, number>>(() => {
    // DB에 저장된 값이 있으면 우선 사용
    if (initialSplitAmounts && Object.keys(initialSplitAmounts).length > 0) {
      return initialSplitAmounts
    }
    // DB 값이 없으면 균등 분할 계산
    return totalAmount ? calcInitialSplits(members, totalAmount) : {}
  })

  // 그룹장 인라인 수정 상태
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")

  // 정산 상태: Record<userId, SettlementStatus>
  // DB에서 읽은 초기값 사용
  const [statuses, setStatuses] = useState<Record<string, SettlementStatus>>(
    initialPaymentStatuses ?? {}
  )

  // 정산금 수정 시작 — Pencil 클릭
  function handleEditStart(userId: string) {
    setEditingUserId(userId)
    setEditingValue(String(splitAmounts[userId] ?? 0))
  }

  // 정산금 저장 — Check 클릭 또는 Enter 키
  // updateGroupSubscription으로 member_split_amounts JSONB 컬럼 업데이트
  function handleEditSave(userId: string) {
    const amount = Number(editingValue)
    if (isNaN(amount) || amount < 0) {
      setEditingUserId(null)
      return
    }

    // 낙관적 UI 업데이트 — 서버 응답 전에 먼저 화면 반영
    const newSplitAmounts = { ...splitAmounts, [userId]: amount }
    setSplitAmounts(newSplitAmounts)
    setEditingUserId(null)

    startTransition(async () => {
      const result = await updateGroupSubscription(groupSubId!, groupId, {
        member_split_amounts: newSplitAmounts,
      })
      if (!result.success) {
        toast.error(result.error ?? "저장에 실패했습니다.")
        // 실패 시 이전 값으로 롤백
        setSplitAmounts(splitAmounts)
      }
    })
  }

  // 정산금 수정 취소
  function handleEditCancel() {
    setEditingUserId(null)
    setEditingValue("")
  }

  // 정산 상태 토글 — 본인 또는 그룹장
  // updateGroupSubscription으로 member_payment_statuses JSONB 컬럼 업데이트
  function handleSettlementToggle(userId: string, checked: boolean) {
    const newStatus: SettlementStatus = checked ? "PAID" : "PENDING"

    // 낙관적 UI 업데이트
    const newStatuses = { ...statuses, [userId]: newStatus }
    setStatuses(newStatuses)

    startTransition(async () => {
      const result = await updateGroupSubscription(groupSubId!, groupId, {
        member_payment_statuses: newStatuses,
      })
      if (!result.success) {
        toast.error(result.error ?? "저장에 실패했습니다.")
        // 실패 시 이전 상태로 롤백
        setStatuses(statuses)
      }
    })
  }

  // 멤버 퇴출 — 그룹장만
  // kickMember Server Action 호출 후 router.refresh()로 멤버 목록 갱신
  function handleKick(memberId: string) {
    startTransition(async () => {
      const result = await kickMember(groupId, memberId)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.error ?? "퇴출에 실패했습니다.")
      }
    })
  }

  // 정산 컬럼 표시 여부
  const showSettlement = !!groupSubId && !!totalAmount

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">멤버</h2>

      <div className="flex flex-col gap-3">
        {members.map((member) => {
          const isSelf = member.user_id === currentUserId
          const isPaid = (statuses[member.user_id] ?? "PENDING") === "PAID"
          const isEditing = editingUserId === member.user_id
          // 금액 공개 범위: 본인 또는 그룹장만 금액 확인 가능
          const canSeeSplitAmount = isSelf || isOwner

          return (
            <div key={member.id} className="flex items-center gap-2">
              {/* 아바타 */}
              {/* 멤버 정보 */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {/* displayName: 닉네임 > 이메일 > user_id 순 */}
                <span className="truncate text-sm">{member.displayName}</span>
                {isSelf && <span className="shrink-0 text-xs text-muted-foreground">(나)</span>}
                <Badge
                  variant={member.role === "OWNER" ? "default" : "outline"}
                  className="shrink-0"
                >
                  {member.role === "OWNER" ? "소유자" : "멤버"}
                </Badge>
              </div>

              {/* 정산금 — groupSubId & totalAmount 있을 때만 표시 */}
              {showSettlement && (
                <div className="flex shrink-0 items-center gap-1">
                  {isEditing ? (
                    // 수정 모드: Input + 저장/취소 버튼
                    <>
                      <Input
                        type="number"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="h-7 w-24 text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        min={0}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEditSave(member.user_id)
                          if (e.key === "Escape") handleEditCancel()
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-500 hover:text-green-600"
                        onClick={() => handleEditSave(member.user_id)}
                        disabled={isPending}
                        aria-label="저장"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={handleEditCancel}
                        aria-label="취소"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  ) : canSeeSplitAmount ? (
                    // 금액 표시 모드 (본인 또는 그룹장)
                    <>
                      <AmountDisplay amount={splitAmounts[member.user_id] ?? 0} />
                      {/* 그룹장만 수정 버튼 표시 */}
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleEditStart(member.user_id)}
                          disabled={isPending}
                          aria-label={`${member.user_id} 정산금 수정`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  ) : (
                    // 타인 & 일반 멤버: 금액 숨김
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </div>
              )}

              {/* 정산 상태 */}
              {showSettlement && (
                <div className="flex shrink-0 items-center gap-1">
                  {isSelf || isOwner ? (
                    // 본인 또는 그룹장: 체크박스 토글
                    <>
                      <Checkbox
                        id={`settlement-${member.user_id}`}
                        checked={isPaid}
                        onCheckedChange={(checked) =>
                          handleSettlementToggle(member.user_id, !!checked)
                        }
                        disabled={isPending}
                        aria-label={isSelf ? "내 분담금 납부 완료" : `${member.user_id} 납부 처리`}
                      />
                      <Label
                        htmlFor={`settlement-${member.user_id}`}
                        className={`cursor-pointer text-xs ${isPaid ? "text-green-500" : "text-muted-foreground"}`}
                      >
                        {isPaid ? "납부완료" : "미납"}
                      </Label>
                    </>
                  ) : (
                    // 타인 & 일반 멤버: 읽기 전용 아이콘
                    <>
                      {isPaid ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/50" />
                      )}
                      <span
                        className={`text-xs ${isPaid ? "text-green-500" : "text-muted-foreground"}`}
                      >
                        {isPaid ? "납부완료" : "미납"}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 그룹장 전용: MEMBER에게만 퇴출 버튼, OWNER 행은 동일 너비 빈 공간으로 정렬 유지 */}
              {isOwner &&
                (member.role === "MEMBER" ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleKick(member.id)}
                    disabled={isPending}
                    aria-label={`${member.user_id} 퇴출`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <div className="h-8 w-8 shrink-0" aria-hidden="true" />
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
